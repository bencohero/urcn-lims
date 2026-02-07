"""RFID Tag encoding utilities.

EPC Structure (96 bits):
- Header: 8 bits
- Filter: 3 bits
- Partition: 3 bits
- Company Prefix: 20-40 bits
- Item Reference: 24-44 bits
- Serial: 36 bits

User Memory Structure:
- Study ID: 32 bits
- Site ID: 16 bits
- Item Type: 8 bits
- Checksum: 16 bits
"""

import hashlib
import secrets
from typing import Any, Dict, Optional
from uuid import UUID


class TagEncoder:
    """RFID Tag encoder for UHF Gen2 tags."""

    # Company prefix (configurable per deployment)
    COMPANY_PREFIX = 0x1234567  # 28 bits

    # Item type codes
    ITEM_TYPE_CODES = {
        "DOCUMENT": 0x01,
        "EQUIPMENT": 0x02,
        "CONSUMABLE": 0x03,
    }

    def generate_epc(
        self,
        item_type: str,
        item_id: UUID,
        company_prefix: int = None,
    ) -> str:
        """
        Generate a 96-bit EPC code.

        Args:
            item_type: Type of item (DOCUMENT, EQUIPMENT, CONSUMABLE)
            item_id: UUID of the item
            company_prefix: Optional company prefix override

        Returns:
            EPC as hexadecimal string (24 hex characters)
        """
        prefix = company_prefix or self.COMPANY_PREFIX

        # Header (SGTIN-96 = 0x30)
        header = 0x30

        # Filter value (standard = 3)
        filter_value = 3

        # Partition (5 = 24-bit company prefix, 20-bit item ref)
        partition = 5

        # Item reference from UUID (use first 20 bits of UUID hash)
        uuid_hash = int(hashlib.md5(str(item_id).encode()).hexdigest()[:5], 16)
        item_reference = uuid_hash & 0xFFFFF  # 20 bits

        # Serial number (36 bits, randomly generated)
        serial = secrets.randbits(36)

        # Build EPC
        # Byte 0: Header (8 bits)
        # Byte 1: Filter (3 bits) + Partition (3 bits) + Company Prefix MSB (2 bits)
        # Bytes 2-4: Company Prefix (remaining 22 bits) + Item Reference (2 bits)
        # Bytes 5-6: Item Reference (remaining 18 bits)
        # Bytes 7-11: Serial (36 bits)

        epc = (
            (header << 88)
            | (filter_value << 85)
            | (partition << 82)
            | (prefix << 58)
            | (item_reference << 38)
            | serial
        )

        return f"{epc:024X}"

    def decode_epc(self, epc: str) -> Dict[str, Any]:
        """
        Decode an EPC string into components.

        Args:
            epc: EPC hexadecimal string

        Returns:
            Dictionary with decoded components
        """
        epc_int = int(epc, 16)

        return {
            "header": (epc_int >> 88) & 0xFF,
            "filter": (epc_int >> 85) & 0x07,
            "partition": (epc_int >> 82) & 0x07,
            "company_prefix": (epc_int >> 58) & 0xFFFFFF,
            "item_reference": (epc_int >> 38) & 0xFFFFF,
            "serial": epc_int & 0xFFFFFFFFF,
        }

    def encode_user_memory(
        self,
        study_id: UUID,
        site_id: UUID,
        item_type: str,
    ) -> Dict[str, Any]:
        """
        Encode user memory data for RFID tag.

        Args:
            study_id: Study UUID
            site_id: Site UUID
            item_type: Item type string

        Returns:
            User memory data as dictionary
        """
        # Convert UUIDs to 32-bit and 16-bit representations
        study_hash = int(hashlib.md5(str(study_id).encode()).hexdigest()[:8], 16)
        site_hash = int(hashlib.md5(str(site_id).encode()).hexdigest()[:4], 16)
        type_code = self.ITEM_TYPE_CODES.get(item_type, 0x00)

        # Calculate checksum
        data = (study_hash << 24) | (site_hash << 8) | type_code
        checksum = self._calculate_checksum(data)

        return {
            "study_id": study_hash,
            "site_id": site_hash,
            "item_type": type_code,
            "checksum": checksum,
            "raw": f"{data:016X}{checksum:04X}",
        }

    def decode_user_memory(self, raw_data: str) -> Dict[str, Any]:
        """
        Decode user memory data.

        Args:
            raw_data: Raw hexadecimal user memory data

        Returns:
            Decoded user memory components
        """
        data = int(raw_data[:16], 16)
        stored_checksum = int(raw_data[16:20], 16)

        study_hash = (data >> 24) & 0xFFFFFFFF
        site_hash = (data >> 8) & 0xFFFF
        type_code = data & 0xFF

        # Verify checksum
        calculated_checksum = self._calculate_checksum(data)
        valid = stored_checksum == calculated_checksum

        # Reverse lookup item type
        item_type = None
        for name, code in self.ITEM_TYPE_CODES.items():
            if code == type_code:
                item_type = name
                break

        return {
            "study_id": study_hash,
            "site_id": site_hash,
            "item_type": item_type,
            "type_code": type_code,
            "checksum_valid": valid,
        }

    def _calculate_checksum(self, data: int) -> int:
        """Calculate CRC-16 checksum."""
        # Simple CRC-16 implementation
        crc = 0xFFFF
        for byte in data.to_bytes(8, byteorder="big"):
            crc ^= byte << 8
            for _ in range(8):
                if crc & 0x8000:
                    crc = (crc << 1) ^ 0x1021
                else:
                    crc <<= 1
                crc &= 0xFFFF
        return crc

    def validate_epc(self, epc: str) -> bool:
        """
        Validate EPC format.

        Args:
            epc: EPC string to validate

        Returns:
            True if valid EPC format
        """
        if not epc:
            return False

        # Check length (24 hex characters = 96 bits)
        if len(epc) != 24:
            return False

        # Check hex format
        try:
            int(epc, 16)
        except ValueError:
            return False

        # Decode and check header
        decoded = self.decode_epc(epc)
        if decoded["header"] not in [0x30, 0x31, 0x32]:  # SGTIN headers
            return False

        return True
