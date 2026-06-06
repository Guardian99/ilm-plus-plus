export type UserRole =
  | 'admin'
  | 'staff'
  | 'hv_risk'
  | 'cc_agent'
  | 'installer'
  | 'operations'
  | 'finance'
  | 'after_sales'

export type LeadStatus =
  | 'intake'
  | 'consent_pending'
  | 'load_assessment'
  | 'docs_pending'
  | 'eligibility_check'
  | 'product_selection'
  | 'verification'
  | 'site_visit_scheduled'
  | 'site_visit_done'
  | 'contract_pending'
  | 'payment_pending'
  | 'payment_confirmed'
  | 'unit_assigned'
  | 'dispatched'
  | 'delivered'
  | 'installation_scheduled'
  | 'installed'
  | 'audit_pending'
  | 'closed_installed'
  | 'closed_rejected'
  | 'closed_declined'

export type GridStatus = 'on_grid' | 'off_grid'

export interface AhqArea {
  id: string
  code: string
  name: string
  region: string | null
  is_active: boolean
  created_at: string
}

export interface Appliance {
  id: string
  category: string
  product_name: string
  wattage: number
  consumption_group: string | null
  is_large_appliance: boolean
  is_active: boolean
  created_at: string
}

export interface Installer {
  id: string
  name: string
  phone: string
  ahq_id: string | null
  is_active: boolean
  created_at: string
}

export interface PricingGroup {
  id: string
  name: string
  site_visit_required: boolean
  verification_modality: string
  payment_options: string[]
  fulfillment_model: string
  consumables_logic: string
  min_kw: number | null
  max_kw: number | null
  base_price: number | null
  is_active: boolean
  created_at: string
}

export interface Lead {
  id: string
  magic_token: string
  status: LeadStatus
  assisted_mode: boolean
  customer_name: string
  customer_phone: string
  customer_email: string | null
  customer_city: string | null
  customer_lat: number | null
  customer_lng: number | null
  customer_location_landmark: string | null
  customer_occupation: string | null
  grid_status: GridStatus | null
  preferred_contact_time: string | null
  use_case: string | null
  source_channel: string | null
  created_by: string | null
  ahq_id: string | null
  load_assessment_kwh: number | null
  load_assessment_kw: number | null
  selected_pricing_group_id: string | null
  payment_reference: string | null
  payment_confirmed_at: string | null
  zendesk_ticket_id: string | null
  closed_reason: string | null
  created_at: string
  updated_at: string
}