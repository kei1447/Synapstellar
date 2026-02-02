'use client'

import { useState } from 'react'
import type { CharacterWithAttributes } from '@/types/database'
import styles from './CharacterCard.module.css'

interface CharacterCardProps {
    character: CharacterWithAttributes & { role?: string }
    onClick?: () => void
    onEdit?: () => void
    onRemove?: () => void
    compact?: boolean
}

export function CharacterCard({
    character,
    onClick,
    onEdit,
    onRemove,
    compact = false
}: CharacterCardProps) {
    const [showMenu, setShowMenu] = useState(false)

    const displayName = character.nicknames && character.nicknames.length > 0
        ? `${character.name}（${character.nicknames[0]}）`
        : character.name

    return (
        <div
            className={`${styles.card} ${compact ? styles.compact : ''}`}
            onClick={onClick}
        >
            <div className={styles.header}>
                <div className={styles.nameSection}>
                    <h3 className={styles.name}>{displayName}</h3>
                    {character.title && (
                        <span className={styles.title}>{character.title}</span>
                    )}
                </div>
                {(onEdit || onRemove) && (
                    <div className={styles.menuWrapper}>
                        <button
                            className={styles.menuButton}
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(!showMenu)
                            }}
                        >
                            ⋮
                        </button>
                        {showMenu && (
                            <div className={styles.menu}>
                                {onEdit && (
                                    <button
                                        className={styles.menuItem}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowMenu(false)
                                            onEdit()
                                        }}
                                    >
                                        編集
                                    </button>
                                )}
                                {onRemove && (
                                    <button
                                        className={`${styles.menuItem} ${styles.danger}`}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowMenu(false)
                                            onRemove()
                                        }}
                                    >
                                        削除
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!compact && (
                <>
                    <div className={styles.info}>
                        {character.gender && <span>性別: {character.gender}</span>}
                        {character.age && <span>年齢: {character.age}</span>}
                        {character.role && <span className={styles.role}>{character.role}</span>}
                    </div>

                    {character.nicknames && character.nicknames.length > 1 && (
                        <div className={styles.nicknames}>
                            <span className={styles.label}>愛称:</span>
                            {character.nicknames.map((nick, i) => (
                                <span key={i} className={styles.nickname}>{nick}</span>
                            ))}
                        </div>
                    )}

                    {character.attributes && character.attributes.length > 0 && (
                        <div className={styles.attributes}>
                            {character.attributes.map((attr) => (
                                <span
                                    key={attr.id}
                                    className={styles.attribute}
                                    style={{ backgroundColor: attr.color || '#7c3aed' }}
                                >
                                    {attr.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {character.memo && (
                        <p className={styles.memo}>{character.memo}</p>
                    )}
                </>
            )}
        </div>
    )
}
