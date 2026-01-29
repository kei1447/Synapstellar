export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            book_tags: {
                Row: {
                    book_id: string
                    created_at: string
                    tag_id: string
                }
                Insert: {
                    book_id: string
                    created_at?: string
                    tag_id: string
                }
                Update: {
                    book_id?: string
                    created_at?: string
                    tag_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "book_tags_book_id_fkey"
                        columns: ["book_id"]
                        isOneToOne: false
                        referencedRelation: "books"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "book_tags_tag_id_fkey"
                        columns: ["tag_id"]
                        isOneToOne: false
                        referencedRelation: "tags"
                        referencedColumns: ["id"]
                    },
                ]
            }
            books: {
                Row: {
                    author: string | null
                    brightness: number | null
                    cover_image_url: string | null
                    created_at: string
                    id: string
                    memo: string | null
                    pos_x: number | null
                    pos_y: number | null
                    pos_z: number | null
                    rating: number | null
                    read_date: string | null
                    title: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    author?: string | null
                    brightness?: number | null
                    cover_image_url?: string | null
                    created_at?: string
                    id?: string
                    memo?: string | null
                    pos_x?: number | null
                    pos_y?: number | null
                    pos_z?: number | null
                    rating?: number | null
                    read_date?: string | null
                    title: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    author?: string | null
                    brightness?: number | null
                    cover_image_url?: string | null
                    created_at?: string
                    id?: string
                    memo?: string | null
                    pos_x?: number | null
                    pos_y?: number | null
                    pos_z?: number | null
                    rating?: number | null
                    read_date?: string | null
                    title?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    display_name: string | null
                    email: string | null
                    id: string
                    updated_at: string
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    display_name?: string | null
                    email?: string | null
                    id: string
                    updated_at?: string
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    display_name?: string | null
                    email?: string | null
                    id?: string
                    updated_at?: string
                }
                Relationships: []
            }
            tags: {
                Row: {
                    color: string | null
                    created_at: string
                    id: string
                    name: string
                    user_id: string
                }
                Insert: {
                    color?: string | null
                    created_at?: string
                    id?: string
                    name: string
                    user_id: string
                }
                Update: {
                    color?: string | null
                    created_at?: string
                    id?: string
                    name?: string
                    user_id?: string
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

// ヘルパー型
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// エイリアス
export type Book = Tables<'books'>
export type Tag = Tables<'tags'>
export type Profile = Tables<'profiles'>
export type BookTag = Tables<'book_tags'>
