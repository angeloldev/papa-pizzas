"""
Gerador de PIX Copia-e-Cola seguindo o padrão BR Code / EMVCo do BACEN.
Referência: https://www.bcb.gov.br/estabilidadefinanceira/pix
"""
import re
import base64
import unicodedata
from io import BytesIO

import qrcode


def _remover_acentos(texto: str) -> str:
    """Normaliza para ASCII puro — obrigatório pelo padrão EMVCo."""
    nfkd = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).upper()


def _tlv(id_campo: str, valor: str) -> str:
    """Monta um campo no formato Tag-Length-Value (TLV)."""
    tamanho = str(len(valor)).zfill(2)
    return f"{id_campo}{tamanho}{valor}"


def _crc16(payload: str) -> str:
    """
    CRC-16/CCITT-FALSE: polinômio 0x1021, valor inicial 0xFFFF.
    É o algoritmo exigido pelo BACEN para validar a integridade do BR Code.
    """
    crc = 0xFFFF
    for char in payload:
        crc ^= ord(char) << 8
        for _ in range(8):
            crc = (crc << 1) ^ 0x1021 if crc & 0x8000 else crc << 1
            crc &= 0xFFFF
    return format(crc, "04X")


def gerar_pix_copia_cola(
    chave: str,
    nome_beneficiario: str,
    cidade: str,
    valor: float,
    txid: str,
) -> str:
    """
    Gera a string PIX Copia-e-Cola (BR Code) pronta para exibir ao cliente.

    Args:
        chave: Chave PIX do recebedor (e-mail, CPF, telefone ou aleatória)
        nome_beneficiario: Nome do recebedor (max 25 chars, somente ASCII)
        cidade: Cidade do recebedor (max 15 chars, somente ASCII)
        valor: Valor exato do pagamento em reais
        txid: Identificador da transação (número do pedido sem caracteres especiais)
    """
    nome = _remover_acentos(nome_beneficiario)[:25]
    cid = _remover_acentos(cidade)[:15]

    # txid: apenas letras e números, máximo 25 caracteres (padrão BACEN)
    txid_limpo = re.sub(r"[^a-zA-Z0-9]", "", txid)[:25]

    # --- Campo 26: Merchant Account Information (dados da conta PIX) ---
    campo_26 = _tlv("26",
        _tlv("00", "BR.GOV.BCB.PIX") +   # GUI obrigatório do BACEN
        _tlv("01", chave)                  # sua chave PIX
    )

    # --- Campo 62: Additional Data Field Template (identificador do pedido) ---
    campo_62 = _tlv("62",
        _tlv("05", txid_limpo)             # ID 05 = referência da transação
    )

    # Monta o payload sem o CRC ainda
    payload_sem_crc = (
        _tlv("00", "01") +                 # ID 00: versão do payload
        _tlv("01", "12") +                 # ID 01: "12" = cobrança única (não reutilizável)
        campo_26 +
        _tlv("52", "0000") +               # ID 52: MCC (0000 = não classificado)
        _tlv("53", "986") +                # ID 53: moeda BRL (ISO 4217)
        _tlv("54", f"{valor:.2f}") +       # ID 54: valor em reais
        _tlv("58", "BR") +                 # ID 58: país (ISO 3166-1)
        _tlv("59", nome) +                 # ID 59: nome do beneficiário
        _tlv("60", cid) +                  # ID 60: cidade do beneficiário
        campo_62 +
        "6304"                             # ID 63: CRC (valor calculado a seguir)
    )

    return payload_sem_crc + _crc16(payload_sem_crc)


def gerar_qrcode_base64(pix_payload: str) -> str:
    """
    Gera um QR Code do PIX Copia-e-Cola como string base64 (PNG).
    O frontend exibe diretamente via: <img src="data:image/png;base64,{resultado}" />
    """
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(pix_payload)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")  # usa Pillow automaticamente
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()
