// ============================================================
// Domain Types - Clinical Storage System
// ============================================================

// --- Generic API Types ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

// --- Auth Types ---

export type RoleCode = 'ADMIN' | 'INVESTIGATOR' | 'ARC' | 'MONITOR' | 'ARCHIVIST' | 'DATA_MANAGER' | 'DATA_CLERK';

export interface Role {
  code: RoleCode;
  name: string;
  permissions?: Record<string, Record<string, boolean>>;
}

export interface UserSite {
  id: string;
  site_number: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  is_superuser: boolean;
  mfa_enabled: boolean;
  roles: Role[];
  sites: UserSite[];
  permissions?: Record<string, Record<string, boolean>>;
  last_login?: string;
  locked_until?: string;
  failed_login_attempts?: number;
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  mfa_code?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

// --- Study Types ---

export type StudyStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'TERMINATED' | 'CANCELLED';
export type StudyPhase = 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV';

export interface Study {
  id: string;
  protocol_number: string;
  title: string;
  sponsor?: string;
  phase?: StudyPhase;
  therapeutic_area?: string;
  start_date?: string;
  end_date?: string;
  estimated_enrollment?: number;
  retention_period_years: number;
  description?: string;
  status: StudyStatus;
  sites_count?: number;
  sites?: Site[];
  statistics?: StudyStatistics;
  created_at: string;
  updated_at?: string;
}

export interface StudyStatistics {
  total_documents: number;
  total_equipment: number;
  total_consumables: number;
  active_access_requests: number;
}

export interface StudyFilters extends PaginationParams {
  status?: StudyStatus;
}

// --- Site Types ---

export type SiteStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED';

export interface Site {
  id: string;
  study_id: string;
  site_number: string;
  name: string;
  country: string;
  city: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  status: SiteStatus;
  has_offline_capability: boolean;
  timezone?: string;
  activation_date?: string;
  storage_locations_count?: number;
  total_items_stored?: number;
  principal_investigator_name?: string;
  principal_investigator?: {
    id?: string;
    name: string;
    email?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface SiteFilters extends PaginationParams {
  study_id?: string;
  status?: SiteStatus;
  country?: string;
  search?: string;
}

// --- Storage Location Types ---

export type LocationType = 'ROOM' | 'ZONE' | 'AREA';

export interface StorageLocation {
  id: string;
  site_id: string;
  parent_location_id: string | null;
  name: string;
  code: string;
  location_type: LocationType;
  floor?: string;
  building?: string;
  temperature_controlled: boolean;
  temperature_min?: number;
  temperature_max?: number;
  access_restricted: boolean;
  capacity_cubic_meters?: number;
  current_usage_percent?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'CLOSED';
  children?: StorageLocation[];
  containers_count?: number;
  items_count?: number;
}

// --- Container Types ---

export type ContainerType = 'CABINET' | 'SHELF' | 'BOX' | 'DRAWER' | 'RACK';

export interface Container {
  id: string;
  location_id: string;
  container_type: ContainerType;
  name: string;
  code: string;
  capacity_items: number;
  current_count: number;
  usage_percent: number;
  dimensions_cm?: string;
  locked: boolean;
  barcode?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// --- Document Types ---

export type DocumentType = 'CONSENT' | 'CRF' | 'SOURCE_DOC';
export type DocumentStatus = 'IN_STORAGE' | 'CHECKED_OUT' | 'IN_TRANSIT' | 'ARCHIVED' | 'DESTROYED';
export type ConfidentialityLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type PhysicalCondition = 'GOOD' | 'FAIR' | 'DAMAGED';

export interface Document {
  id: string;
  study_id: string;
  site_id: string;
  container_id?: string;
  study?: { protocol_number: string; title: string };
  site?: { site_number: string; name: string };
  document_type: DocumentType;
  subject_id: string;
  visit_number: string;
  form_name: string;
  version: string;
  page_count: number;
  signature_required: boolean;
  signed_date?: string;
  confidentiality_level: ConfidentialityLevel;
  status: DocumentStatus;
  container?: { id: string; name: string; code: string };
  location?: { id: string; name: string; code: string };
  rfid_tag?: { epc: string };
  internal_code?: string;
  description?: string;
  quantity?: number;
  storage_date: string;
  expected_retention_until: string;
  physical_condition?: PhysicalCondition;
  location_notes?: string;
  movements?: Movement[];
  access_requests?: AccessRequestSummary[];
  created_at: string;
  updated_at?: string;
}

export interface CreateDocumentRequest {
  study_id: string;
  site_id: string;
  container_id: string;
  document_type: DocumentType;
  subject_id: string;
  visit_number: string;
  form_name: string;
  version: string;
  page_count: number;
  signature_required: boolean;
  signed_date?: string;
  confidentiality_level: ConfidentialityLevel;
  internal_code?: string;
  description?: string;
  quantity?: number;
  storage_date: string;
  expected_retention_until: string;
  physical_condition?: PhysicalCondition;
  location_notes?: string;
}

export interface UpdateDocumentRequest {
  container_id?: string;
  description?: string;
  physical_condition?: PhysicalCondition;
  location_notes?: string;
  status?: DocumentStatus;
  confidentiality_level?: ConfidentialityLevel;
}

export interface DocumentFilters extends PaginationParams {
  study_id?: string;
  site_id?: string;
  document_type?: DocumentType;
  status?: DocumentStatus;
  subject_id?: string;
  from_date?: string;
  to_date?: string;
}

// --- Equipment Types ---

export type EquipmentType = 'CENTRIFUGE' | 'REFRIGERATOR' | 'FREEZER' | 'INCUBATOR' | 'MICROSCOPE' | 'BALANCE' | 'PH_METER';
export type OperationalStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'DECOMMISSIONED';
export type EquipmentStatus = 'IN_STORAGE' | 'CHECKED_OUT' | 'IN_TRANSIT';

export interface Equipment {
  id: string;
  container_id?: string;
  study?: { protocol_number: string; title: string };
  site?: { site_number: string; name: string };
  equipment_type: EquipmentType;
  manufacturer: string;
  model: string;
  serial_number: string;
  calibration_required: boolean;
  last_calibration_date?: string;
  next_calibration_date?: string;
  operational_status: OperationalStatus;
  status: EquipmentStatus;
  container?: { id: string; name: string; code: string };
  location?: { id: string; name: string; code: string };
  rfid_tag?: { epc: string };
  internal_code?: string;
  description?: string;
  storage_date: string;
  purchase_date?: string;
  purchase_cost?: number;
  currency?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateEquipmentRequest {
  study_id: string;
  site_id: string;
  container_id: string;
  equipment_type: EquipmentType;
  manufacturer: string;
  model: string;
  serial_number: string;
  calibration_required: boolean;
  next_calibration_date?: string;
  operational_status: OperationalStatus;
  internal_code?: string;
  description?: string;
  storage_date: string;
  purchase_date?: string;
  purchase_cost?: number;
  currency?: string;
}

export interface EquipmentFilters extends PaginationParams {
  study_id?: string;
  site_id?: string;
  equipment_type?: EquipmentType;
  status?: EquipmentStatus;
  calibration_due_before?: string;
}

// --- Consumable Types ---

export type ConsumableType = 'REAGENT' | 'TUBE' | 'PIPETTE_TIP' | 'CULTURE_MEDIA' | 'GLOVE' | 'SWAB';
export type ConsumableUnit = 'VIAL' | 'PIECE' | 'BOX' | 'PACK' | 'BOTTLE' | 'KIT';

export interface Consumable {
  id: string;
  container_id?: string;
  study?: { protocol_number: string; title: string };
  site?: { site_number: string; name: string };
  consumable_type: ConsumableType;
  manufacturer: string;
  catalog_number: string;
  lot_number: string;
  expiry_date: string;
  storage_conditions?: string;
  hazardous: boolean;
  hazard_classification?: string;
  quantity: number;
  unit: ConsumableUnit;
  status: 'IN_STORAGE' | 'IN_USE' | 'EXPIRED' | 'DISPOSED';
  container?: { id: string; name: string; code: string };
  location?: { id: string; name: string; code: string };
  internal_code?: string;
  description?: string;
  storage_date: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateConsumableRequest {
  study_id: string;
  site_id: string;
  container_id: string;
  consumable_type: ConsumableType;
  manufacturer: string;
  catalog_number: string;
  lot_number: string;
  expiry_date: string;
  storage_conditions?: string;
  hazardous: boolean;
  hazard_classification?: string;
  quantity: number;
  unit: ConsumableUnit;
  internal_code?: string;
  description?: string;
  storage_date: string;
}

export interface ConsumableFilters extends PaginationParams {
  study_id?: string;
  site_id?: string;
  consumable_type?: ConsumableType;
  expiry_before?: string;
  hazardous?: boolean;
}

// --- Access Request Types ---

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
export type RequestType = 'CONSULTATION' | 'COPY' | 'LOAN';
export type Urgency = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface AccessRequestSummary {
  id: string;
  request_number: string;
  requester: { name: string };
  status: AccessRequestStatus;
  requested_at: string;
}

export interface AccessRequest {
  id: string;
  request_number: string;
  item: {
    id: string;
    type: 'DOCUMENT' | 'EQUIPMENT' | 'CONSUMABLE';
    description: string;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
  requester_site: {
    site_number: string;
    name: string;
  };
  request_type: RequestType;
  purpose: string;
  urgency: Urgency;
  status: AccessRequestStatus;
  requested_at: string;
  required_by_date?: string;
  hours_pending?: number;
  reviewed_by?: { name: string };
  reviewed_at?: string;
  review_notes?: string;
  approved_duration_days?: number;
  expected_return_date?: string;
  actual_access_date?: string;
  actual_return_date?: string;
  was_late?: boolean;
  extension_requested?: boolean;
  extension_approved?: boolean | null;
  extension_days?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAccessRequestRequest {
  stored_item_id: string;
  requester_site_id: string;
  request_type: RequestType;
  purpose: string;
  urgency: Urgency;
  required_by_date?: string;
}

export interface ApproveAccessRequestRequest {
  approved_duration_days: number;
  review_notes?: string;
}

export interface RejectAccessRequestRequest {
  review_notes: string;
}

export interface FulfillAccessRequestRequest {
  actual_access_date: string;
  notes?: string;
}

export interface ReturnAccessRequestRequest {
  actual_return_date: string;
  notes?: string;
}

export interface ExtendAccessRequestRequest {
  extension_days: number;
  extension_reason: string;
}

export interface AccessRequestFilters extends PaginationParams {
  status?: AccessRequestStatus;
  requester_id?: string;
  site_id?: string;
  urgency?: Urgency;
  from_date?: string;
}

// --- RFID Types ---

export type TagType = 'UHF_GEN2';
export type TagStatus = 'ACTIVE' | 'INACTIVE' | 'DAMAGED' | 'LOST';

export interface RFIDTag {
  id: string;
  epc: string;
  tid?: string;
  tag_type: TagType;
  associated_item_id: string;
  associated_item_type: 'DOCUMENT' | 'EQUIPMENT' | 'CONSUMABLE';
  associated_item?: {
    id: string;
    type: string;
    description: string;
  };
  encoding_date: string;
  last_read_date?: string;
  read_count?: number;
  status: TagStatus;
}

export interface EncodeTagRequest {
  associated_item_id: string;
  associated_item_type: 'DOCUMENT' | 'EQUIPMENT' | 'CONSUMABLE';
  user_memory?: Record<string, string>;
}

export interface ReadTagRequest {
  reader_id: string;
  epc: string;
}

export interface ReadTagResponse {
  tag: {
    id: string;
    epc: string;
    status: TagStatus;
  };
  item: {
    id: string;
    type: string;
    document_type?: string;
    subject_id?: string;
    description: string;
    status: string;
    location: {
      container: string;
      location: string;
    };
  };
}

export interface BulkReadRequest {
  reader_id: string;
  location_id: string;
  epcs: string[];
}

export interface BulkReadResponse {
  total_tags_read: number;
  successful_reads: number;
  failed_reads: number;
  tags: Array<{
    epc: string;
    item: Record<string, unknown>;
  }>;
}

export interface RFIDFilters extends PaginationParams {
  associated_item_type?: 'DOCUMENT' | 'EQUIPMENT' | 'CONSUMABLE';
  status?: TagStatus;
}

// --- Notification Types ---

export type NotificationType = 'ACCESS_REQUEST' | 'CALIBRATION' | 'EXPIRY' | 'OVERDUE' | 'SYSTEM' | 'MOVEMENT';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Notification {
  id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  is_read: boolean;
  sent_at: string;
  read_at?: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

export interface NotificationFilters extends PaginationParams {
  is_read?: boolean;
  notification_type?: NotificationType;
  from_date?: string;
}

// --- Report Types ---

export type ReportFormat = 'pdf' | 'excel' | 'csv';
export type ReportType = 'inventory' | 'movements' | 'access-requests' | 'audit-trail' | 'statistics';

export interface ReportRequest {
  study_id?: string;
  site_id?: string;
  from_date?: string;
  to_date?: string;
  format: ReportFormat;
  group_by?: string;
}

export interface ScheduledReport {
  id: string;
  report_type: ReportType;
  format: ReportFormat;
  schedule: string;
  recipients: string[];
  filters: Record<string, string>;
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  created_at: string;
}

export interface DashboardStatistics {
  period: { start: string; end: string };
  inventory: {
    total_documents: number;
    total_equipment: number;
    total_consumables: number;
    total_items: number;
  };
  movements?: {
    entries: number;
    exits: number;
    returns: number;
    net_change: number;
  };
  access_requests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    fulfilled: number;
    overdue: number;
    average_approval_time_hours?: number;
  };
  storage_capacity?: {
    total_capacity: number;
    current_usage: number;
    usage_percent: number;
    locations_above_90_percent: number;
  };
  alerts: {
    calibration_due_soon?: number;
    items_expiring_30_days?: number;
    overdue_returns: number;
  };
}

// --- Audit Trail Types ---

export type AuditEventType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'READ' | 'VERIFY' | 'ARCHIVE' | 'RESTORE';

export interface AuditEntry {
  id: string;
  event_type: string;
  table_name: string | null;
  record_id: string | null;
  user: {
    id: string;
    username: string;
    full_name: string;
  } | null;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  site_id?: string;
  timestamp: string;
  hash_current: string;
}

export interface AuditTrailFilters extends PaginationParams {
  user_id?: string;
  event_type?: string;
  table_name?: string;
  from_timestamp?: string;
  to_timestamp?: string;
}

export interface IntegrityVerification {
  total_records_checked: number;
  verified_count?: number;
  integrity_valid: boolean;
  broken_chain_detected: boolean;
  details: {
    first_record_id?: string;
    last_record_id?: string;
    verification_timestamp?: string;
    message?: string;
    broken_at_id?: string;
    breaks?: Array<{
      record_id: string;
      timestamp: string;
      expected_previous?: string;
      actual_previous?: string;
      issue?: string;
    }>;
    checked_range?: { from?: string; to?: string };
  };
}

// --- Movement Types ---

export type MovementType = 'IN' | 'OUT' | 'TRANSFER';

export interface Movement {
  id: string;
  movement_type: MovementType;
  performed_by: { name: string };
  movement_date: string;
  notes?: string;
}

// --- Offline/Sync Types ---

export interface PendingAction {
  id: string;
  type: string;
  method: string;
  args?: unknown[];
  timestamp: string;
}

export interface SyncPushRequest {
  actions: Array<{
    action_type: 'CREATE' | 'UPDATE' | 'DELETE';
    table_name: string;
    record_id?: string;
    client_timestamp: string;
    payload: Record<string, unknown>;
  }>;
}

export interface SyncPullResponse {
  changes: Array<{
    table_name: string;
    record_id: string;
    change_type: 'CREATE' | 'UPDATE' | 'DELETE';
    timestamp: string;
    data: Record<string, unknown>;
  }>;
  total_changes: number;
  server_timestamp: string;
}

// --- WebSocket Types ---

export interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
}

// --- Search Types ---

export interface GlobalSearchResult {
  documents: Document[];
  equipment: Equipment[];
  consumables: Consumable[];
  total_results: number;
}

// --- Toast Types ---

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
