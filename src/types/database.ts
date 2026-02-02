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
      book_characters: {
        Row: {
          book_id: string
          character_id: string
          created_at: string
          role: string | null
        }
        Insert: {
          book_id: string
          character_id: string
          created_at?: string
          role?: string | null
        }
        Update: {
          book_id?: string
          character_id?: string
          created_at?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_characters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
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
          description: string | null
          google_books_id: string | null
          id: string
          image_color: string | null
          memo: string | null
          page_count: number | null
          pos_x: number | null
          pos_y: number | null
          pos_z: number | null
          published_date: string | null
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
          description?: string | null
          google_books_id?: string | null
          id?: string
          image_color?: string | null
          memo?: string | null
          page_count?: number | null
          pos_x?: number | null
          pos_y?: number | null
          pos_z?: number | null
          published_date?: string | null
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
          description?: string | null
          google_books_id?: string | null
          id?: string
          image_color?: string | null
          memo?: string | null
          page_count?: number | null
          pos_x?: number | null
          pos_y?: number | null
          pos_z?: number | null
          published_date?: string | null
          rating?: number | null
          read_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      character_attribute_tags: {
        Row: {
          attribute_id: string
          character_id: string
          created_at: string
        }
        Insert: {
          attribute_id: string
          character_id: string
          created_at?: string
        }
        Update: {
          attribute_id?: string
          character_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_attribute_tags_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "character_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_attribute_tags_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_attributes: {
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
      character_relationships: {
        Row: {
          created_at: string
          description: string | null
          from_character_id: string
          id: string
          relationship_type: string
          to_character_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          from_character_id: string
          id?: string
          relationship_type: string
          to_character_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          from_character_id?: string
          id?: string
          relationship_type?: string
          to_character_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_relationships_from_character_id_fkey"
            columns: ["from_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_relationships_to_character_id_fkey"
            columns: ["to_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: string | null
          created_at: string
          gender: string | null
          id: string
          memo: string | null
          name: string
          nicknames: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          memo?: string | null
          name: string
          nicknames?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          memo?: string | null
          name?: string
          nicknames?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emotion_tags: {
        Row: {
          book_id: string
          created_at: string | null
          emotion: string
          id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          emotion: string
          id?: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          emotion?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotion_tags_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
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
export type Character = Tables<'characters'>
export type CharacterAttribute = Tables<'character_attributes'>
export type CharacterAttributeTag = Tables<'character_attribute_tags'>
export type BookCharacter = Tables<'book_characters'>
export type CharacterRelationship = Tables<'character_relationships'>

// 拡張型（リレーション付き）
export type CharacterWithAttributes = Character & {
  attributes: CharacterAttribute[]
}

export type CharacterWithRelationships = Character & {
  attributes: CharacterAttribute[]
  relationships: (CharacterRelationship & {
    toCharacter: Character
  })[]
}

export type BookWithCharacters = Book & {
  characters: (BookCharacter & {
    character: CharacterWithAttributes
  })[]
}
