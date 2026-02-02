'use client'

import { useState } from 'react'
import type { CharacterWithAttributes, CharacterAttribute } from '@/types/database'
import { CharacterCard } from './CharacterCard'
import { AttributeFilter, type FilterState } from './AttributeFilter'
import styles from './CharacterList.module.css'

interface CharacterListProps {
    characters: (CharacterWithAttributes & { role?: string })[]
    attributes: CharacterAttribute[]
    onCharacterClick?: (character: CharacterWithAttributes) => void
    onEditCharacter?: (character: CharacterWithAttributes) => void
    onRemoveCharacter?: (characterId: string) => void
    onAddCharacter?: () => void
    showFilter?: boolean
    emptyMessage?: string
}

export function CharacterList({
    characters,
    attributes,
    onCharacterClick,
    onEditCharacter,
    onRemoveCharacter,
    onAddCharacter,
    showFilter = true,
    emptyMessage = '登場人物がまだ登録されていません'
}: CharacterListProps) {
    const [filter, setFilter] = useState<FilterState>({ include: [], exclude: [] })

    // フィルタリング処理
    const filteredCharacters = characters.filter((char) => {
        const charAttrIds = char.attributes?.map((a) => a.id) || []

        // AND条件: includeに含まれる属性をすべて持っている
        const matchesInclude = filter.include.every((attrId) =>
            charAttrIds.includes(attrId)
        )

        // NOT条件: excludeに含まれる属性を1つも持っていない
        const matchesExclude = !filter.exclude.some((attrId) =>
            charAttrIds.includes(attrId)
        )

        return matchesInclude && matchesExclude
    })

    const hasActiveFilter = filter.include.length > 0 || filter.exclude.length > 0

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>登場人物</h2>
                {onAddCharacter && (
                    <button className={styles.addButton} onClick={onAddCharacter}>
                        + 追加
                    </button>
                )}
            </div>

            {showFilter && attributes.length > 0 && (
                <AttributeFilter
                    attributes={attributes}
                    filter={filter}
                    onChange={setFilter}
                />
            )}

            {filteredCharacters.length === 0 ? (
                <div className={styles.empty}>
                    {hasActiveFilter ? (
                        <p>条件に一致する人物がいません</p>
                    ) : (
                        <p>{emptyMessage}</p>
                    )}
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredCharacters.map((character) => (
                        <CharacterCard
                            key={character.id}
                            character={character}
                            onClick={() => onCharacterClick?.(character)}
                            onEdit={onEditCharacter ? () => onEditCharacter(character) : undefined}
                            onRemove={onRemoveCharacter ? () => onRemoveCharacter(character.id) : undefined}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
