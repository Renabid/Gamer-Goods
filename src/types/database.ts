export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'customer' | 'admin' | 'moderator'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'admin' | 'moderator'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'admin' | 'moderator'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon_name: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon_name?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name: string
          slug?: string
          description?: string | null
          icon_name?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          slug: string
          subtitle: string | null
          description: string | null
          banner_url: string | null
          thumbnail_url: string | null
          image_url: string | null
          platform_notice: string | null
          delivery_type: 'instant' | 'manual' | 'code'
          requires_player_id: boolean
          requires_server_id: boolean
          player_id_label: string | null
          server_id_label: string | null
          is_featured: boolean
          is_active: boolean
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          slug: string
          subtitle?: string | null
          description?: string | null
          banner_url?: string | null
          thumbnail_url?: string | null
          image_url?: string | null
          platform_notice?: string | null
          delivery_type?: 'instant' | 'manual' | 'code'
          requires_player_id?: boolean
          requires_server_id?: boolean
          player_id_label?: string | null
          server_id_label?: string | null
          is_featured?: boolean
          is_active?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          slug?: string
          subtitle?: string | null
          description?: string | null
          banner_url?: string | null
          thumbnail_url?: string | null
          image_url?: string | null
          platform_notice?: string | null
          delivery_type?: 'instant' | 'manual' | 'code'
          requires_player_id?: boolean
          requires_server_id?: boolean
          player_id_label?: string | null
          server_id_label?: string | null
          is_featured?: boolean
          is_active?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          price_poisha: number
          compare_at_price_poisha: number | null
          in_stock: boolean
          stock_quantity: number | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          price_poisha: number
          compare_at_price_poisha?: number | null
          in_stock?: boolean
          stock_quantity?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          price_poisha?: number
          compare_at_price_poisha?: number | null
          in_stock?: boolean
          stock_quantity?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          customer_email: string
          customer_phone: string | null
          customer_name: string | null
          status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed'
          total_amount_poisha: number
          discount_amount_poisha: number
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id?: string | null
          customer_email: string
          customer_phone?: string | null
          customer_name?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed'
          total_amount_poisha: number
          discount_amount_poisha?: number
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string | null
          customer_email?: string
          customer_phone?: string | null
          customer_name?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed'
          total_amount_poisha?: number
          discount_amount_poisha?: number
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_variant_id: string | null
          product_name: string
          variant_name: string
          unit_price_poisha: number
          quantity: number
          subtotal_poisha: number
          player_id_value: string | null
          server_id_value: string | null
          digital_code_delivered: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_variant_id?: string | null
          product_name: string
          variant_name: string
          unit_price_poisha: number
          quantity?: number
          subtotal_poisha: number
          player_id_value?: string | null
          server_id_value?: string | null
          digital_code_delivered?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_variant_id?: string | null
          product_name?: string
          variant_name?: string
          unit_price_poisha?: number
          quantity?: number
          subtotal_poisha?: number
          player_id_value?: string | null
          server_id_value?: string | null
          digital_code_delivered?: string | null
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          order_id: string
          payment_method: string
          payment_method_id?: string | null
          account_details?: string | null
          payment_snapshot?: Json | null
          admin_verified_at?: string | null
          admin_verified_by?: string | null
          status: 'initiated' | 'processing' | 'completed' | 'failed' | 'refunded'
          amount_poisha: number
          transaction_id: string | null
          sender_number: string | null
          gateway_reference: string | null
          gateway_response: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          payment_method: string
          payment_method_id?: string | null
          account_details?: string | null
          payment_snapshot?: Json | null
          admin_verified_at?: string | null
          admin_verified_by?: string | null
          status?: 'initiated' | 'processing' | 'completed' | 'failed' | 'refunded'
          amount_poisha: number
          transaction_id?: string | null
          sender_number?: string | null
          gateway_reference?: string | null
          gateway_response?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          payment_method?: 'bkash' | 'nagad' | 'rocket' | 'manual_transfer' | 'sslcommerz'
          status?: 'initiated' | 'processing' | 'completed' | 'failed' | 'refunded'
          amount_poisha?: number
          transaction_id?: string | null
          sender_number?: string | null
          gateway_reference?: string | null
          gateway_response?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_events: {
        Row: {
          id: string
          order_id: string
          actor_id: string | null
          event_type: string
          notes: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          actor_id?: string | null
          event_type: string
          notes?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          actor_id?: string | null
          event_type?: string
          notes?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          id: string
          name: string
          slug: string
          payment_type: 'mfs' | 'bank_transfer' | 'custom'
          account_number: string
          account_type: 'Personal' | 'Merchant' | 'Agent' | 'Bank Account' | 'Other' | null
          instructions: string | null
          qr_code_url: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string
          payment_type?: 'mfs' | 'bank_transfer' | 'custom'
          account_number: string
          account_type?: 'Personal' | 'Merchant' | 'Agent' | 'Bank Account' | 'Other' | null
          instructions?: string | null
          qr_code_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          payment_type?: 'mfs' | 'bank_transfer' | 'custom'
          account_number?: string
          account_type?: 'Personal' | 'Merchant' | 'Agent' | 'Bank Account' | 'Other' | null
          instructions?: string | null
          qr_code_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Domain helper types
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row'] & {
  server_input_type?: 'text' | 'dropdown'
  server_options?: string[]
  custom_fields?: CustomFieldConfig[]
}
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  custom_fields?: Record<string, string> | null
}
export type Payment = Database['public']['Tables']['payments']['Row'] & {
  payment_method_id?: string | null
  account_details?: string | null
  payment_snapshot?: Record<string, unknown> | null
  admin_verified_at?: string | null
  admin_verified_by?: string | null
}
export type Profile = Database['public']['Tables']['profiles']['Row']

export interface CustomFieldConfig {
  id: string
  label: string
  placeholder?: string
  required?: boolean
  type?: 'text' | 'number'
}

export interface PaymentMethod {
  id: string
  name: string
  slug: string
  payment_type: 'mfs' | 'bank_transfer' | 'custom'
  account_number: string
  account_type: 'Personal' | 'Merchant' | 'Agent' | 'Bank Account' | 'Other' | null
  instructions: string | null
  qr_code_url: string | null
  is_active: boolean
  display_order: number
  created_at?: string
  updated_at?: string
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[]
  category?: Category | null
}
