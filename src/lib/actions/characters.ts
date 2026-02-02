'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
    Character,
    CharacterAttribute,
    CharacterRelationship,
    CharacterWithAttributes,
    Insertable,
    Updatable
} from '@/types/database'

// ============================================
// Characters CRUD
// ============================================

export async function getCharacters(): Promise<CharacterWithAttributes[]> {
    const supabase = await createClient()

    const { data: characters, error } = await supabase
        .from('characters')
        .select(`
      *,
      character_attribute_tags (
        attribute_id,
        character_attributes (*)
      )
    `)
        .order('created_at', { ascending: false })

    if (error) throw error

    return (characters || []).map((char) => ({
        ...char,
        attributes: char.character_attribute_tags?.map(
            (tag: { character_attributes: CharacterAttribute }) => tag.character_attributes
        ) || []
    }))
}

export async function getCharactersByBookId(bookId: string): Promise<CharacterWithAttributes[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('book_characters')
        .select(`
      role,
      characters (
        *,
        character_attribute_tags (
          attribute_id,
          character_attributes (*)
        )
      )
    `)
        .eq('book_id', bookId)

    if (error) throw error

    return (data || [])
        .filter((item) => item.characters !== null)
        .map((item) => {
            const char = item.characters as unknown as Character & {
                character_attribute_tags: { character_attributes: CharacterAttribute }[]
            }
            return {
                ...char,
                role: item.role,
                attributes: char.character_attribute_tags?.map(
                    (tag) => tag.character_attributes
                ) || []
            }
        })
}

export async function getCharacterById(id: string): Promise<CharacterWithAttributes | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('characters')
        .select(`
      *,
      character_attribute_tags (
        attribute_id,
        character_attributes (*)
      )
    `)
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw error
    }

    return {
        ...data,
        attributes: data.character_attribute_tags?.map(
            (tag: { character_attributes: CharacterAttribute }) => tag.character_attributes
        ) || []
    }
}

export async function createCharacter(
    character: Insertable<'characters'>,
    attributeIds?: string[]
): Promise<Character> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('characters')
        .insert(character)
        .select()
        .single()

    if (error) throw error

    // 属性タグを追加
    if (attributeIds && attributeIds.length > 0) {
        const { error: tagError } = await supabase
            .from('character_attribute_tags')
            .insert(
                attributeIds.map((attrId) => ({
                    character_id: data.id,
                    attribute_id: attrId
                }))
            )
        if (tagError) throw tagError
    }

    revalidatePath('/books')
    return data
}

export async function updateCharacter(
    id: string,
    updates: Updatable<'characters'>,
    attributeIds?: string[]
): Promise<Character> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error

    // 属性タグを更新（既存を削除して再挿入）
    if (attributeIds !== undefined) {
        await supabase
            .from('character_attribute_tags')
            .delete()
            .eq('character_id', id)

        if (attributeIds.length > 0) {
            const { error: tagError } = await supabase
                .from('character_attribute_tags')
                .insert(
                    attributeIds.map((attrId) => ({
                        character_id: id,
                        attribute_id: attrId
                    }))
                )
            if (tagError) throw tagError
        }
    }

    revalidatePath('/books')
    return data
}

export async function deleteCharacter(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id)

    if (error) throw error

    revalidatePath('/books')
}

// ============================================
// Book Characters (本と人物の紐付け)
// ============================================

export async function addCharacterToBook(
    bookId: string,
    characterId: string,
    role?: string
): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('book_characters')
        .insert({
            book_id: bookId,
            character_id: characterId,
            role
        })

    if (error) throw error

    revalidatePath(`/books/${bookId}`)
}

export async function removeCharacterFromBook(
    bookId: string,
    characterId: string
): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('book_characters')
        .delete()
        .eq('book_id', bookId)
        .eq('character_id', characterId)

    if (error) throw error

    revalidatePath(`/books/${bookId}`)
}

export async function updateBookCharacterRole(
    bookId: string,
    characterId: string,
    role: string | null
): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('book_characters')
        .update({ role })
        .eq('book_id', bookId)
        .eq('character_id', characterId)

    if (error) throw error

    revalidatePath(`/books/${bookId}`)
}

// ============================================
// Character Attributes (属性)
// ============================================

export async function getCharacterAttributes(): Promise<CharacterAttribute[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('character_attributes')
        .select('*')
        .order('name')

    if (error) throw error

    return data || []
}

export async function createCharacterAttribute(
    attribute: Insertable<'character_attributes'>
): Promise<CharacterAttribute> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('character_attributes')
        .insert(attribute)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function updateCharacterAttribute(
    id: string,
    updates: Updatable<'character_attributes'>
): Promise<CharacterAttribute> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('character_attributes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteCharacterAttribute(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('character_attributes')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// ============================================
// Character Relationships (人物関係)
// ============================================

export async function getRelationshipsByCharacterId(
    characterId: string
): Promise<(CharacterRelationship & { toCharacter: Character })[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('character_relationships')
        .select(`
      *,
      toCharacter:characters!character_relationships_to_character_id_fkey (*)
    `)
        .eq('from_character_id', characterId)

    if (error) throw error

    return (data || []) as (CharacterRelationship & { toCharacter: Character })[]
}

export async function getRelationshipsForBook(
    bookId: string
): Promise<(CharacterRelationship & { fromCharacter: Character; toCharacter: Character })[]> {
    const supabase = await createClient()

    // まず本に紐づく人物のIDを取得
    const { data: bookChars, error: bookCharsError } = await supabase
        .from('book_characters')
        .select('character_id')
        .eq('book_id', bookId)

    if (bookCharsError) throw bookCharsError

    const characterIds = bookChars?.map((bc) => bc.character_id) || []

    if (characterIds.length === 0) return []

    // その人物間の関係を取得
    const { data, error } = await supabase
        .from('character_relationships')
        .select(`
      *,
      fromCharacter:characters!character_relationships_from_character_id_fkey (*),
      toCharacter:characters!character_relationships_to_character_id_fkey (*)
    `)
        .in('from_character_id', characterIds)
        .in('to_character_id', characterIds)

    if (error) throw error

    return (data || []) as (CharacterRelationship & {
        fromCharacter: Character
        toCharacter: Character
    })[]
}

export async function createRelationship(
    relationship: Insertable<'character_relationships'>
): Promise<CharacterRelationship> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('character_relationships')
        .insert(relationship)
        .select()
        .single()

    if (error) throw error

    revalidatePath('/books')
    return data
}

export async function updateRelationship(
    id: string,
    updates: Updatable<'character_relationships'>
): Promise<CharacterRelationship> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('character_relationships')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error

    revalidatePath('/books')
    return data
}

export async function deleteRelationship(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('character_relationships')
        .delete()
        .eq('id', id)

    if (error) throw error

    revalidatePath('/books')
}
