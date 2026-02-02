'use client'

import { useState, useEffect } from 'react'
import type { Character, CharacterAttribute, Insertable, Updatable } from '@/types/database'
import styles from './CharacterForm.module.css'

interface CharacterFormProps {
    character?: Character & { attributes?: CharacterAttribute[] }
    allAttributes: CharacterAttribute[]
    onSubmit: (
        data: Insertable<'characters'> | Updatable<'characters'>,
        attributeIds: string[]
    ) => Promise<void>
    onCancel: () => void
    onCreateAttribute?: (name: string) => Promise<CharacterAttribute>
    isLoading?: boolean
}

export function CharacterForm({
    character,
    allAttributes,
    onSubmit,
    onCancel,
    onCreateAttribute,
    isLoading = false
}: CharacterFormProps) {
    const [name, setName] = useState(character?.name || '')
    const [nicknames, setNicknames] = useState<string[]>(character?.nicknames || [])
    const [nicknameInput, setNicknameInput] = useState('')
    const [gender, setGender] = useState(character?.gender || '')
    const [age, setAge] = useState(character?.age || '')
    const [title, setTitle] = useState(character?.title || '')
    const [memo, setMemo] = useState(character?.memo || '')
    const [selectedAttributes, setSelectedAttributes] = useState<string[]>(
        character?.attributes?.map((a) => a.id) || []
    )
    const [newAttributeName, setNewAttributeName] = useState('')
    const [attributes, setAttributes] = useState(allAttributes)

    useEffect(() => {
        setAttributes(allAttributes)
    }, [allAttributes])

    const handleAddNickname = () => {
        if (nicknameInput.trim() && !nicknames.includes(nicknameInput.trim())) {
            setNicknames([...nicknames, nicknameInput.trim()])
            setNicknameInput('')
        }
    }

    const handleRemoveNickname = (nick: string) => {
        setNicknames(nicknames.filter((n) => n !== nick))
    }

    const handleToggleAttribute = (attrId: string) => {
        if (selectedAttributes.includes(attrId)) {
            setSelectedAttributes(selectedAttributes.filter((id) => id !== attrId))
        } else {
            setSelectedAttributes([...selectedAttributes, attrId])
        }
    }

    const handleCreateAttribute = async () => {
        if (!newAttributeName.trim() || !onCreateAttribute) return

        try {
            const newAttr = await onCreateAttribute(newAttributeName.trim())
            setAttributes([...attributes, newAttr])
            setSelectedAttributes([...selectedAttributes, newAttr.id])
            setNewAttributeName('')
        } catch (error) {
            console.error('Failed to create attribute:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const data = {
            name,
            nicknames,
            gender: gender || null,
            age: age || null,
            title: title || null,
            memo: memo || null
        }

        await onSubmit(data, selectedAttributes)
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.title}>
                {character ? '人物を編集' : '新規人物を追加'}
            </h2>

            <div className={styles.field}>
                <label className={styles.label}>名前 *</label>
                <input
                    type="text"
                    className={styles.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: イワン・カラマーゾフ"
                    required
                />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>愛称・別名</label>
                <div className={styles.nicknameInput}>
                    <input
                        type="text"
                        className={styles.input}
                        value={nicknameInput}
                        onChange={(e) => setNicknameInput(e.target.value)}
                        placeholder="例: ワーニャ"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddNickname()
                            }
                        }}
                    />
                    <button
                        type="button"
                        className={styles.addButton}
                        onClick={handleAddNickname}
                    >
                        追加
                    </button>
                </div>
                {nicknames.length > 0 && (
                    <div className={styles.nicknames}>
                        {nicknames.map((nick) => (
                            <span key={nick} className={styles.nickname}>
                                {nick}
                                <button
                                    type="button"
                                    className={styles.removeNickname}
                                    onClick={() => handleRemoveNickname(nick)}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label className={styles.label}>性別</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        placeholder="例: 男"
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>年齢</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="例: 23歳"
                    />
                </div>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>肩書</label>
                <input
                    type="text"
                    className={styles.input}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: 学生、次男"
                />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>属性</label>
                <div className={styles.attributes}>
                    {attributes.map((attr) => (
                        <button
                            key={attr.id}
                            type="button"
                            className={`${styles.attributeChip} ${selectedAttributes.includes(attr.id) ? styles.selected : ''
                                }`}
                            style={{
                                '--attr-color': attr.color || '#7c3aed'
                            } as React.CSSProperties}
                            onClick={() => handleToggleAttribute(attr.id)}
                        >
                            {attr.name}
                        </button>
                    ))}
                </div>
                {onCreateAttribute && (
                    <div className={styles.newAttribute}>
                        <input
                            type="text"
                            className={styles.input}
                            value={newAttributeName}
                            onChange={(e) => setNewAttributeName(e.target.value)}
                            placeholder="新しい属性を追加..."
                        />
                        <button
                            type="button"
                            className={styles.addButton}
                            onClick={handleCreateAttribute}
                            disabled={!newAttributeName.trim()}
                        >
                            作成
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.field}>
                <label className={styles.label}>メモ</label>
                <textarea
                    className={styles.textarea}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="人物の特徴、性格など..."
                    rows={3}
                />
            </div>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    キャンセル
                </button>
                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={!name.trim() || isLoading}
                >
                    {isLoading ? '保存中...' : character ? '更新' : '追加'}
                </button>
            </div>
        </form>
    )
}
