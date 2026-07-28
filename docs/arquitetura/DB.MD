## Table `user_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `text` |  |
| `name` | `text` |  |
| `role` | `text` |  |
| `department` | `text` |  Nullable |
| `phone` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `clients`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `document_number` | `text` |  Nullable |
| `contact_name` | `text` |  Nullable |
| `contact_phone` | `text` |  Nullable |
| `contact_email` | `text` |  Nullable |
| `address` | `text` |  Nullable |
| `city` | `text` |  Nullable |
| `state` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `client_status` | `text` |  |
| `contracts_count` | `int4` |  Nullable |
| `quotations_count` | `int4` |  Nullable |
| `last_interaction` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `location_url` | `text` |  Nullable |
| `classification` | `text` |  Nullable |
| `contacts` | `jsonb` |  |

## Table `leads`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `company` | `text` |  Nullable |
| `phone` | `text` |  Nullable |
| `email` | `text` |  Nullable |
| `source` | `text` |  Nullable |
| `status` | `text` |  |
| `notes` | `text` |  Nullable |
| `converted_client_id` | `uuid` |  Nullable |
| `converted_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `contacts` | `jsonb` |  |
| `scheduled_at` | `timestamptz` |  Nullable |
| `document_number` | `text` |  |
| `city` | `text` |  |
| `state` | `text` |  |
| `classification` | `text` |  |
| `phone_ddd` | `text` |  |
| `phone_number` | `text` |  |

## Table `crm_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `entity_type` | `text` |  |
| `entity_id` | `uuid` |  |
| `description` | `text` |  |
| `created_by` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `equipment`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `code` | `text` |  Unique |
| `name` | `text` |  |
| `description` | `text` |  Nullable |
| `brand` | `text` |  Nullable |
| `model` | `text` |  Nullable |
| `serial_number` | `text` |  Nullable |
| `power_kva` | `numeric` |  Nullable |
| `fuel_type` | `text` |  Nullable |
| `year_manufacture` | `int4` |  Nullable |
| `status` | `text` |  |
| `rental_daily_rate` | `numeric` |  Nullable |
| `rental_monthly_rate` | `numeric` |  Nullable |
| `location` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `image_url` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `quotations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `code` | `text` |  Unique |
| `client_id` | `uuid` |  Nullable |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `status` | `text` |  |
| `valid_until` | `date` |  Nullable |
| `total_amount` | `numeric` |  Nullable |
| `discount_percent` | `numeric` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `quotation_items`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `quotation_id` | `uuid` |  |
| `equipment_id` | `uuid` |  Nullable |
| `description` | `text` |  |
| `quantity` | `int4` |  |
| `unit_price` | `numeric` |  |
| `total_price` | `numeric` |  |
| `rental_period_days` | `int4` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `contracts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `code` | `text` |  Unique |
| `client_id` | `uuid` |  |
| `quotation_id` | `uuid` |  Nullable |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `status` | `text` |  |
| `start_date` | `date` |  |
| `end_date` | `date` |  Nullable |
| `monthly_value` | `numeric` |  Nullable |
| `total_value` | `numeric` |  Nullable |
| `payment_terms` | `text` |  Nullable |
| `contract_file_url` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `contract_equipment`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `contract_id` | `uuid` |  |
| `equipment_id` | `uuid` |  |
| `rental_value` | `numeric` |  Nullable |
| `delivery_date` | `date` |  Nullable |
| `return_date` | `date` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `maintenance_orders`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `code` | `text` |  Unique |
| `equipment_id` | `uuid` |  |
| `type` | `text` |  |
| `priority` | `text` |  |
| `status` | `text` |  |
| `description` | `text` |  |
| `scheduled_date` | `date` |  Nullable |
| `completed_date` | `date` |  Nullable |
| `cost` | `numeric` |  Nullable |
| `technician` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `service_order_url` | `text` |  Nullable |
| `requester_id` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `billings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `code` | `text` |  Unique |
| `contract_id` | `uuid` |  |
| `client_id` | `uuid` |  |
| `description` | `text` |  Nullable |
| `amount` | `numeric` |  |
| `due_date` | `date` |  |
| `payment_date` | `date` |  Nullable |
| `status` | `text` |  |
| `payment_method` | `text` |  Nullable |
| `invoice_number` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `stock_items`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `code` | `text` |  Unique |
| `name` | `text` |  |
| `category` | `text` |  Nullable |
| `quantity` | `numeric` |  |
| `unit` | `text` |  |
| `min_stock` | `numeric` |  Nullable |
| `unit_price` | `numeric` |  Nullable |
| `location` | `text` |  Nullable |
| `status` | `text` |  |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `stock_movements`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `stock_item_id` | `uuid` |  |
| `type` | `text` |  |
| `reason` | `text` |  Nullable |
| `quantity` | `numeric` |  |
| `unit_price` | `numeric` |  Nullable |
| `total_value` | `numeric` |  Nullable |
| `maintenance_order_id` | `uuid` |  Nullable |
| `equipment_id` | `uuid` |  Nullable |
| `performed_by` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `pricing_generators`

Tabela de preços de locação de geradores por potência e período

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `power_kva` | `varchar` |  |
| `power_min_kva` | `int4` |  Nullable |
| `power_max_kva` | `int4` |  Nullable |
| `equipment_type` | `varchar` |  Nullable |
| `rental_period` | `varchar` |  |
| `price_standby` | `numeric` |  Nullable |
| `price_120h` | `numeric` |  Nullable |
| `price_240h` | `numeric` |  Nullable |
| `price_360h` | `numeric` |  Nullable |
| `price_continuous` | `numeric` |  Nullable |
| `price_extra_hour` | `numeric` |  Nullable |
| `price_cable_kit_380v` | `numeric` |  Nullable |
| `price_cable_kit_220v` | `numeric` |  Nullable |
| `price_preventive_maintenance` | `numeric` |  Nullable |
| `discount_limit_percent` | `numeric` |  Nullable |
| `is_active` | `bool` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `pricing_accessories`

Tabela de preços de acessórios e serviços complementares

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `item_code` | `varchar` |  |
| `item_name` | `varchar` |  |
| `category` | `varchar` |  |
| `price_monthly` | `numeric` |  Nullable |
| `price_biweekly` | `numeric` |  Nullable |
| `price_weekly` | `numeric` |  Nullable |
| `price_daily` | `numeric` |  Nullable |
| `price_unit` | `numeric` |  Nullable |
| `discount_limit_percent` | `numeric` |  Nullable |
| `amperage` | `varchar` |  Nullable |
| `capacity` | `varchar` |  Nullable |
| `is_active` | `bool` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `sales_quotations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `document_id` | `varchar` |  Unique |
| `client_id` | `uuid` |  Nullable |
| `lead_id` | `uuid` |  Nullable |
| `tipo` | `varchar` |  |
| `status` | `varchar` |  |
| `data_emissao` | `date` |  |
| `validade` | `date` |  |
| `conteudo` | `jsonb` |  |
| `total_equipamentos` | `numeric` |  |
| `total_servicos` | `numeric` |  |
| `total_geral` | `numeric` |  |
| `desconto_percent` | `numeric` |  |
| `desconto_valor` | `numeric` |  |
| `total_com_desconto` | `numeric` |  |
| `notas_internas` | `text` |  Nullable |
| `version` | `int4` |  |
| `parent_id` | `uuid` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `updated_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `sales_quotation_audit_log`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `quotation_id` | `uuid` |  |
| `action` | `varchar` |  |
| `old_status` | `varchar` |  Nullable |
| `new_status` | `varchar` |  Nullable |
| `changes` | `jsonb` |  Nullable |
| `notes` | `text` |  Nullable |
| `performed_by` | `uuid` |  Nullable |
| `performed_at` | `timestamptz` |  |

## Table `contact_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `entity_type` | `text` |  |
| `entity_id` | `uuid` |  |
| `contacted_person` | `text` |  |
| `notes` | `text` |  |
| `created_by` | `text` |  |
| `created_at` | `timestamptz` |  |
| `contacted_at` | `timestamptz` |  |

