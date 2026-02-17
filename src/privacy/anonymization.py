"""
Data Anonymization and PII Protection
Implements techniques to protect personally identifiable information
"""
import hashlib
import hmac
import secrets
from typing import Dict, List, Optional, Any, Set
import pandas as pd
import numpy as np
import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class PIIDetector:
    """
    Detect personally identifiable information in data
    
    Identifies potential PII fields for protection
    """
    
    # Pattern definitions for common PII
    EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    PHONE_PATTERN = re.compile(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b')
    SSN_PATTERN = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
    CREDIT_CARD_PATTERN = re.compile(r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b')
    IP_PATTERN = re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b')
    
    # Common PII column name patterns
    PII_COLUMN_PATTERNS = [
        'name', 'email', 'phone', 'ssn', 'address', 'credit_card',
        'passport', 'driver_license', 'dob', 'birth', 'maiden',
        'username', 'password', 'ip_address', 'lat', 'lon', 'latitude',
        'longitude', 'geolocation', 'user_id', 'customer_id'
    ]
    
    def detect_pii_columns(self, df: pd.DataFrame) -> Dict[str, List[str]]:
        """
        Detect columns containing PII
        
        Returns:
            Dictionary mapping PII type to list of column names
        """
        pii_columns: Dict[str, List[str]] = {
            'email': [],
            'phone': [],
            'ssn': [],
            'credit_card': [],
            'ip_address': [],
            'potential_name': [],
            'potential_id': []
        }
        
        for col in df.columns:
            col_lower = col.lower()
            
            # Check column name patterns
            if any(pattern in col_lower for pattern in ['email', 'mail']):
                pii_columns['email'].append(col)
            elif any(pattern in col_lower for pattern in ['phone', 'mobile', 'tel']):
                pii_columns['phone'].append(col)
            elif 'ssn' in col_lower or 'social_security' in col_lower:
                pii_columns['ssn'].append(col)
            elif any(pattern in col_lower for pattern in ['card', 'credit', 'debit']):
                pii_columns['credit_card'].append(col)
            elif 'ip' in col_lower or 'ip_address' in col_lower:
                pii_columns['ip_address'].append(col)
            elif any(pattern in col_lower for pattern in ['name', 'customer', 'user']):
                if 'id' in col_lower:
                    pii_columns['potential_id'].append(col)
                else:
                    pii_columns['potential_name'].append(col)
            
            # Check data content patterns (sample first 100 rows)
            if df[col].dtype == 'object':
                sample = df[col].dropna().head(100).astype(str)
                
                if sample.empty:
                    continue
                
                # Count pattern matches
                email_matches = sum(1 for x in sample if isinstance(x, str) and self.EMAIL_PATTERN.search(x))
                phone_matches = sum(1 for x in sample if isinstance(x, str) and self.PHONE_PATTERN.search(x))
                ssn_matches = sum(1 for x in sample if isinstance(x, str) and self.SSN_PATTERN.search(x))
                cc_matches = sum(1 for x in sample if isinstance(x, str) and self.CREDIT_CARD_PATTERN.search(x))
                ip_matches = sum(1 for x in sample if isinstance(x, str) and self.IP_PATTERN.search(x))
                
                # If >50% of samples match pattern, mark as PII
                threshold = len(sample) * 0.5
                
                if email_matches > threshold and col not in pii_columns['email']:
                    pii_columns['email'].append(col)
                if phone_matches > threshold and col not in pii_columns['phone']:
                    pii_columns['phone'].append(col)
                if ssn_matches > threshold and col not in pii_columns['ssn']:
                    pii_columns['ssn'].append(col)
                if cc_matches > threshold and col not in pii_columns['credit_card']:
                    pii_columns['credit_card'].append(col)
                if ip_matches > threshold and col not in pii_columns['ip_address']:
                    pii_columns['ip_address'].append(col)
        
        # Remove empty categories
        pii_columns = {k: v for k, v in pii_columns.items() if v}
        
        if pii_columns:
            logger.info(f"Detected PII in columns: {pii_columns}")
        
        return pii_columns


class DataAnonymizer:
    """
    Anonymize sensitive data while preserving utility
    
    Implements multiple anonymization techniques:
    - Tokenization
    - Hashing
    - Masking
    - Generalization
    - K-anonymity
    """
    
    def __init__(self, secret_key: Optional[str] = None):
        """
        Initialize anonymizer
        
        Args:
            secret_key: Secret key for deterministic hashing (consistent tokens)
        """
        self.secret_key = secret_key or secrets.token_hex(32)
        self.token_mapping: Dict[str, str] = {}
        
    def tokenize(
        self,
        data: pd.Series,
        prefix: str = "TOKEN"
    ) -> pd.Series:
        """
        Replace values with random tokens
        
        Maintains uniqueness - same value gets same token
        """
        unique_values = data.unique()
        
        for value in unique_values:
            if pd.isna(value):
                continue
            
            if value not in self.token_mapping:
                token = f"{prefix}_{secrets.token_hex(8).upper()}"
                self.token_mapping[value] = token
        
        return data.map(lambda x: self.token_mapping.get(x, x))
    
    def hash_column(
        self,
        data: pd.Series,
        algorithm: str = 'sha256'
    ) -> pd.Series:
        """
        Hash sensitive values
        
        One-way transformation - cannot be reversed
        """
        def hash_value(value):
            if pd.isna(value):
                return value
            
            value_str = str(value)
            
            if algorithm == 'sha256':
                return hashlib.sha256(value_str.encode()).hexdigest()
            elif algorithm == 'sha1':
                return hashlib.sha1(value_str.encode()).hexdigest()
            elif algorithm == 'md5':
                return hashlib.md5(value_str.encode()).hexdigest()
            else:
                raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        return data.apply(hash_value)
    
    def hmac_hash(
        self,
        data: pd.Series,
        algorithm: str = 'sha256'
    ) -> pd.Series:
        """
        HMAC hash with secret key
        
        More secure than plain hashing
        """
        def hmac_value(value):
            if pd.isna(value):
                return value
            
            value_bytes = str(value).encode()
            key_bytes = self.secret_key.encode()
            
            return hmac.new(key_bytes, value_bytes, algorithm).hexdigest()
        
        return data.apply(hmac_value)
    
    def mask_data(
        self,
        data: pd.Series,
        mask_char: str = '*',
        visible_start: int = 0,
        visible_end: int = 0
    ) -> pd.Series:
        """
        Mask data with specified character
        
        Args:
            mask_char: Character to use for masking
            visible_start: Number of characters visible at start
            visible_end: Number of characters visible at end
        
        Example:
            "1234567890" with visible_start=2, visible_end=2 -> "12******90"
        """
        def mask_value(value):
            if pd.isna(value):
                return value
            
            value_str = str(value)
            length = len(value_str)
            
            if length <= visible_start + visible_end:
                return mask_char * length
            
            start = value_str[:visible_start]
            end = value_str[-visible_end:] if visible_end > 0 else ""
            middle = mask_char * (length - visible_start - visible_end)
            
            return start + middle + end
        
        return data.apply(mask_value)
    
    def mask_email(self, data: pd.Series) -> pd.Series:
        """Mask email addresses: user@domain.com -> u***@domain.com"""
        def mask_email_value(email):
            if pd.isna(email) or '@' not in str(email):
                return email
            
            parts = str(email).split('@')
            if len(parts) != 2:
                return email
            
            username = parts[0]
            domain = parts[1]
            
            if len(username) <= 1:
                masked_username = '*' * len(username)
            else:
                masked_username = username[0] + '*' * (len(username) - 1)
            
            return f"{masked_username}@{domain}"
        
        return data.apply(mask_email_value)
    
    def mask_credit_card(self, data: pd.Series) -> pd.Series:
        """Mask credit card: 1234567890123456 -> ************3456"""
        return self.mask_data(data, visible_start=0, visible_end=4)
    
    def generalize_age(
        self,
        ages: pd.Series,
        bins: List[int] = [0, 18, 25, 35, 45, 55, 65, 100]
    ) -> pd.Series:
        """
        Generalize ages into ranges
        
        Reduces granularity for privacy (k-anonymity)
        """
        labels = [f"{bins[i]}-{bins[i+1]}" for i in range(len(bins)-1)]
        return pd.cut(ages, bins=bins, labels=labels, include_lowest=True)
    
    def generalize_location(
        self,
        locations: pd.Series,
        precision: int = 2
    ) -> pd.Series:
        """
        Generalize geographic coordinates
        
        Args:
            precision: Number of decimal places (lower = less precise)
        """
        return locations.round(precision)
    
    def anonymize_dataframe(
        self,
        df: pd.DataFrame,
        anonymization_rules: Dict[str, Dict[str, Any]]
    ) -> pd.DataFrame:
        """
        Anonymize entire DataFrame based on rules
        
        Args:
            df: Input DataFrame
            anonymization_rules: Dict mapping column names to anonymization config
                Example:
                {
                    'email': {'method': 'mask_email'},
                    'credit_card': {'method': 'mask', 'visible_end': 4},
                    'name': {'method': 'tokenize'},
                    'age': {'method': 'generalize_age', 'bins': [0, 18, 30, 50, 100]}
                }
        
        Returns:
            Anonymized DataFrame
        """
        df_anon = df.copy()
        
        for column, rules in anonymization_rules.items():
            if column not in df_anon.columns:
                logger.warning(f"Column {column} not found in DataFrame")
                continue
            
            method = rules.get('method')
            
            if method == 'tokenize':
                df_anon[column] = self.tokenize(df_anon[column])
            
            elif method == 'hash':
                algorithm = rules.get('algorithm', 'sha256')
                df_anon[column] = self.hash_column(df_anon[column], algorithm)
            
            elif method == 'hmac':
                algorithm = rules.get('algorithm', 'sha256')
                df_anon[column] = self.hmac_hash(df_anon[column], algorithm)
            
            elif method == 'mask':
                visible_start = rules.get('visible_start', 0)
                visible_end = rules.get('visible_end', 0)
                df_anon[column] = self.mask_data(
                    df_anon[column], 
                    visible_start=visible_start,
                    visible_end=visible_end
                )
            
            elif method == 'mask_email':
                df_anon[column] = self.mask_email(df_anon[column])
            
            elif method == 'mask_credit_card':
                df_anon[column] = self.mask_credit_card(df_anon[column])
            
            elif method == 'generalize_age':
                bins = rules.get('bins', [0, 18, 25, 35, 45, 55, 65, 100])
                df_anon[column] = self.generalize_age(df_anon[column], bins)
            
            elif method == 'drop':
                df_anon = df_anon.drop(columns=[column])
            
            else:
                logger.warning(f"Unknown anonymization method: {method}")
        
        logger.info(f"Anonymized {len(anonymization_rules)} columns")
        
        return df_anon
    
    def get_token_mapping(self) -> Dict[str, str]:
        """Get token mapping for reverse lookup (if needed)"""
        return self.token_mapping.copy()


class KAnonymity:
    """
    Implement k-anonymity privacy protection
    
    Ensures each record is indistinguishable from at least k-1 other records
    """
    
    @staticmethod
    def check_k_anonymity(
        df: pd.DataFrame,
        quasi_identifiers: List[str],
        k: int = 5
    ) -> Dict[str, Any]:
        """
        Check if dataset satisfies k-anonymity
        
        Args:
            df: DataFrame to check
            quasi_identifiers: Columns that could identify individuals
            k: Minimum group size
            
        Returns:
            Dictionary with anonymity status and statistics
        """
        # Group by quasi-identifiers
        grouped = df.groupby(quasi_identifiers).size().reset_index(name='count')
        
        # Find groups smaller than k
        violations = grouped[grouped['count'] < k]
        
        is_anonymous = len(violations) == 0
        
        result = {
            'k_anonymous': is_anonymous,
            'k': k,
            'total_groups': len(grouped),
            'violation_count': len(violations),
            'min_group_size': grouped['count'].min(),
            'max_group_size': grouped['count'].max(),
            'mean_group_size': grouped['count'].mean(),
            'affected_records': violations['count'].sum() if not violations.empty else 0
        }
        
        if not is_anonymous:
            logger.warning(f"K-anonymity violated: {len(violations)} groups < k={k}")
            result['sample_violations'] = violations.head(10).to_dict('records')
        
        return result
    
    @staticmethod
    def achieve_k_anonymity(
        df: pd.DataFrame,
        quasi_identifiers: List[str],
        k: int = 5,
        method: str = 'suppression'
    ) -> pd.DataFrame:
        """
        Transform dataset to achieve k-anonymity
        
        Args:
            df: Input DataFrame
            quasi_identifiers: Columns to anonymize
            k: Target k value
            method: 'suppression' (remove small groups) or 'generalization' (group values)
            
        Returns:
            K-anonymous DataFrame
        """
        df_anon = df.copy()
        
        if method == 'suppression':
            # Remove records in groups smaller than k
            group_sizes = df_anon.groupby(quasi_identifiers).size()
            valid_groups = group_sizes[group_sizes >= k].index
            
            # Keep only records in valid groups
            mask = df_anon.set_index(quasi_identifiers).index.isin(valid_groups)
            df_anon = df_anon[mask].reset_index(drop=True)
            
            removed = len(df) - len(df_anon)
            logger.info(f"Suppression: removed {removed} records to achieve {k}-anonymity")
        
        elif method == 'generalization':
            # This is simplified - real generalization requires domain knowledge
            logger.warning("Generalization not fully implemented - using suppression")
            return KAnonymity.achieve_k_anonymity(df, quasi_identifiers, k, 'suppression')
        
        return df_anon
