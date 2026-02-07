"""Constants and enumerations."""

from enum import Enum


class DocumentType(str, Enum):
    """Document type enumeration."""

    CONSENT = "CONSENT"
    CRF = "CRF"
    SOURCE_DOC = "SOURCE_DOC"
    LAB_REPORT = "LAB_REPORT"
    PROTOCOL = "PROTOCOL"
    IB = "IB"  # Investigator Brochure
    AE_REPORT = "AE_REPORT"
    SAE_REPORT = "SAE_REPORT"
    MONITORING_REPORT = "MONITORING_REPORT"
    AUDIT_REPORT = "AUDIT_REPORT"
    CORRESPONDENCE = "CORRESPONDENCE"
    OTHER = "OTHER"


class EquipmentType(str, Enum):
    """Equipment type enumeration."""

    ANALYZER = "ANALYZER"
    CENTRIFUGE = "CENTRIFUGE"
    REFRIGERATOR = "REFRIGERATOR"
    FREEZER = "FREEZER"
    INCUBATOR = "INCUBATOR"
    MICROSCOPE = "MICROSCOPE"
    SCALE = "SCALE"
    PH_METER = "PH_METER"
    THERMOMETER = "THERMOMETER"
    COMPUTER = "COMPUTER"
    PRINTER = "PRINTER"
    SCANNER = "SCANNER"
    OTHER = "OTHER"


class ConsumableType(str, Enum):
    """Consumable type enumeration."""

    REAGENT = "REAGENT"
    TUBE = "TUBE"
    SYRINGE = "SYRINGE"
    NEEDLE = "NEEDLE"
    GLOVE = "GLOVE"
    PIPETTE_TIP = "PIPETTE_TIP"
    CULTURE_MEDIA = "CULTURE_MEDIA"
    BUFFER = "BUFFER"
    KIT = "KIT"
    LABEL = "LABEL"
    OTHER = "OTHER"


class ItemStatus(str, Enum):
    """Stored item status enumeration."""

    IN_STORAGE = "IN_STORAGE"
    IN_USE = "IN_USE"
    OUT = "OUT"
    ARCHIVED = "ARCHIVED"
    DESTROYED = "DESTROYED"


class AccessRequestStatus(str, Enum):
    """Access request status enumeration."""

    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"
    OVERDUE = "OVERDUE"
    RETURNED = "RETURNED"


class AccessRequestType(str, Enum):
    """Access request type enumeration."""

    CONSULTATION = "CONSULTATION"
    COPY = "COPY"
    LOAN = "LOAN"


class MovementType(str, Enum):
    """Movement type enumeration."""

    IN = "IN"
    OUT = "OUT"
    TRANSFER = "TRANSFER"
    RETURN = "RETURN"
    ARCHIVE = "ARCHIVE"
    DESTROY = "DESTROY"


class NotificationType(str, Enum):
    """Notification type enumeration."""

    ACCESS_REQUEST_CREATED = "ACCESS_REQUEST_CREATED"
    ACCESS_REQUEST_APPROVED = "ACCESS_REQUEST_APPROVED"
    ACCESS_REQUEST_REJECTED = "ACCESS_REQUEST_REJECTED"
    ACCESS_REQUEST_FULFILLED = "ACCESS_REQUEST_FULFILLED"
    RETURN_REMINDER = "RETURN_REMINDER"
    RETURN_OVERDUE = "RETURN_OVERDUE"
    CALIBRATION_DUE = "CALIBRATION_DUE"
    EXPIRY_WARNING = "EXPIRY_WARNING"
    STOCK_LOW = "STOCK_LOW"
    CAPACITY_HIGH = "CAPACITY_HIGH"
    SYSTEM_ALERT = "SYSTEM_ALERT"


class NotificationPriority(str, Enum):
    """Notification priority enumeration."""

    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class UserRole(str, Enum):
    """User role codes."""

    ADMIN = "ADMIN"
    INVESTIGATOR = "INVESTIGATOR"
    ARC = "ARC"  # Attaché de Recherche Clinique
    MONITOR = "MONITOR"
    ARCHIVIST = "ARCHIVIST"
    DATA_MANAGER = "DATA_MANAGER"
    DATA_CLERK = "DATA_CLERK"


class StudyStatus(str, Enum):
    """Study status enumeration."""

    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class SiteStatus(str, Enum):
    """Site status enumeration."""

    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    CLOSED = "CLOSED"


class PhysicalCondition(str, Enum):
    """Physical condition enumeration."""

    GOOD = "GOOD"
    FAIR = "FAIR"
    DAMAGED = "DAMAGED"


class ConfidentialityLevel(str, Enum):
    """Confidentiality level enumeration."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class OperationalStatus(str, Enum):
    """Equipment operational status enumeration."""

    OPERATIONAL = "OPERATIONAL"
    MAINTENANCE = "MAINTENANCE"
    DEFECTIVE = "DEFECTIVE"
    RETIRED = "RETIRED"


class AuditEventType(str, Enum):
    """Audit event type enumeration."""

    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    LOGIN_FAILED = "LOGIN_FAILED"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    PERMISSION_CHANGE = "PERMISSION_CHANGE"
    EXPORT = "EXPORT"
