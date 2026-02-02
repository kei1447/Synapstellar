'use client'

import type { CharacterAttribute } from '@/types/database'
import styles from './AttributeFilter.module.css'

export interface FilterState {
    include: string[]  // AND条件
    exclude: string[]  // NOT条件
}

interface AttributeFilterProps {
    attributes: CharacterAttribute[]
    filter: FilterState
    onChange: (filter: FilterState) => void
}

export function AttributeFilter({
    attributes,
    filter,
    onChange
}: AttributeFilterProps) {
    const handleClick = (attrId: string, e: React.MouseEvent) => {
        // Shiftキー押下時はNOT条件
        const isExclude = e.shiftKey

        if (isExclude) {
            // exclude操作
            if (filter.exclude.includes(attrId)) {
                // 既にexcludeにある場合は解除
                onChange({
                    ...filter,
                    exclude: filter.exclude.filter((id) => id !== attrId)
                })
            } else {
                // includeから削除してexcludeに追加
                onChange({
                    include: filter.include.filter((id) => id !== attrId),
                    exclude: [...filter.exclude, attrId]
                })
            }
        } else {
            // include操作
            if (filter.include.includes(attrId)) {
                // 既にincludeにある場合は解除
                onChange({
                    ...filter,
                    include: filter.include.filter((id) => id !== attrId)
                })
            } else {
                // excludeから削除してincludeに追加
                onChange({
                    include: [...filter.include, attrId],
                    exclude: filter.exclude.filter((id) => id !== attrId)
                })
            }
        }
    }

    const clearFilter = () => {
        onChange({ include: [], exclude: [] })
    }

    const hasActiveFilter = filter.include.length > 0 || filter.exclude.length > 0

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.label}>属性フィルター</span>
                <span className={styles.hint}>
                    クリック: AND | Shift+クリック: NOT
                </span>
                {hasActiveFilter && (
                    <button className={styles.clearButton} onClick={clearFilter}>
                        クリア
                    </button>
                )}
            </div>
            <div className={styles.chips}>
                {attributes.map((attr) => {
                    const isIncluded = filter.include.includes(attr.id)
                    const isExcluded = filter.exclude.includes(attr.id)

                    return (
                        <button
                            key={attr.id}
                            className={`${styles.chip} ${isIncluded ? styles.included : ''} ${isExcluded ? styles.excluded : ''}`}
                            style={{
                                '--attr-color': attr.color || '#7c3aed'
                            } as React.CSSProperties}
                            onClick={(e) => handleClick(attr.id, e)}
                        >
                            {isIncluded && <span className={styles.icon}>✓</span>}
                            {isExcluded && <span className={styles.icon}>✗</span>}
                            {attr.name}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
