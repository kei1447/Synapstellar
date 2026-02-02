"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type {
    Book,
    Tag,
    CharacterWithAttributes,
    CharacterAttribute,
    CharacterRelationship,
    Character,
} from "@/types/database";
import {
    CharacterList,
    CharacterForm,
    RelationshipGraph,
} from "@/components/characters";
import {
    createCharacter,
    updateCharacter,
    deleteCharacter,
    addCharacterToBook,
    removeCharacterFromBook,
    createCharacterAttribute,
    createRelationship,
} from "@/lib/actions/characters";
import styles from "./BookDetailClient.module.css";

interface BookDetailClientProps {
    book: Book;
    tags: Tag[];
    emotions: string[];
    characters: (CharacterWithAttributes & { role?: string })[];
    allCharacters: CharacterWithAttributes[];
    attributes: CharacterAttribute[];
    relationships: (CharacterRelationship & {
        fromCharacter: Character;
        toCharacter: Character;
    })[];
    userId: string;
}

type TabType = "info" | "characters" | "graph";
type ModalType = "none" | "addCharacter" | "editCharacter" | "addExisting" | "addRelationship";

export function BookDetailClient({
    book,
    tags,
    emotions,
    characters,
    allCharacters,
    attributes,
    relationships,
    userId,
}: BookDetailClientProps) {
    const [activeTab, setActiveTab] = useState<TabType>("info");
    const [modalType, setModalType] = useState<ModalType>("none");
    const [editingCharacter, setEditingCharacter] = useState<CharacterWithAttributes | null>(null);
    const [isPending, startTransition] = useTransition();
    const [localCharacters, setLocalCharacters] = useState(characters);
    const [localAttributes, setLocalAttributes] = useState(attributes);
    const [localRelationships, setLocalRelationships] = useState(relationships);

    // 関係性追加用
    const [relationshipFrom, setRelationshipFrom] = useState("");
    const [relationshipTo, setRelationshipTo] = useState("");
    const [relationshipType, setRelationshipType] = useState("");

    const handleCreateCharacter = async (
        data: any,
        attributeIds: string[]
    ) => {
        startTransition(async () => {
            try {
                const newChar = await createCharacter(
                    { ...data, user_id: userId },
                    attributeIds
                );
                // 本に紐付け
                await addCharacterToBook(book.id, newChar.id);
                // ローカル状態を更新
                const charWithAttrs = {
                    ...newChar,
                    attributes: localAttributes.filter((a) =>
                        attributeIds.includes(a.id)
                    ),
                };
                setLocalCharacters([...localCharacters, charWithAttrs]);
                setModalType("none");
            } catch (error) {
                console.error("Failed to create character:", error);
            }
        });
    };

    const handleUpdateCharacter = async (
        data: any,
        attributeIds: string[]
    ) => {
        if (!editingCharacter) return;
        startTransition(async () => {
            try {
                const updated = await updateCharacter(
                    editingCharacter.id,
                    data,
                    attributeIds
                );
                const charWithAttrs = {
                    ...updated,
                    role: (editingCharacter as any).role,
                    attributes: localAttributes.filter((a) =>
                        attributeIds.includes(a.id)
                    ),
                };
                setLocalCharacters(
                    localCharacters.map((c) =>
                        c.id === updated.id ? charWithAttrs : c
                    )
                );
                setModalType("none");
                setEditingCharacter(null);
            } catch (error) {
                console.error("Failed to update character:", error);
            }
        });
    };

    const handleRemoveCharacter = async (characterId: string) => {
        if (!confirm("この人物を本から削除しますか？（人物データ自体は残ります）")) return;
        startTransition(async () => {
            try {
                await removeCharacterFromBook(book.id, characterId);
                setLocalCharacters(localCharacters.filter((c) => c.id !== characterId));
            } catch (error) {
                console.error("Failed to remove character:", error);
            }
        });
    };

    const handleAddExistingCharacter = async (characterId: string) => {
        startTransition(async () => {
            try {
                await addCharacterToBook(book.id, characterId);
                const char = allCharacters.find((c) => c.id === characterId);
                if (char) {
                    setLocalCharacters([...localCharacters, char]);
                }
                setModalType("none");
            } catch (error) {
                console.error("Failed to add character:", error);
            }
        });
    };

    const handleCreateAttribute = async (name: string) => {
        const newAttr = await createCharacterAttribute({
            name,
            user_id: userId,
        });
        setLocalAttributes([...localAttributes, newAttr]);
        return newAttr;
    };

    const handleAddRelationship = async () => {
        if (!relationshipFrom || !relationshipTo || !relationshipType) return;
        startTransition(async () => {
            try {
                const newRel = await createRelationship({
                    from_character_id: relationshipFrom,
                    to_character_id: relationshipTo,
                    relationship_type: relationshipType,
                });
                const fromChar = localCharacters.find((c) => c.id === relationshipFrom);
                const toChar = localCharacters.find((c) => c.id === relationshipTo);
                if (fromChar && toChar) {
                    setLocalRelationships([
                        ...localRelationships,
                        { ...newRel, fromCharacter: fromChar, toCharacter: toChar },
                    ]);
                }
                setModalType("none");
                setRelationshipFrom("");
                setRelationshipTo("");
                setRelationshipType("");
            } catch (error) {
                console.error("Failed to add relationship:", error);
            }
        });
    };

    // 本に紐づいていない既存人物
    const availableCharacters = allCharacters.filter(
        (c) => !localCharacters.some((lc) => lc.id === c.id)
    );

    return (
        <>
            {/* 本の基本情報ヘッダー */}
            <div className={styles.bookHeader}>
                {book.cover_image_url && (
                    <div className={styles.coverWrapper}>
                        <Image
                            src={book.cover_image_url}
                            alt={book.title}
                            width={150}
                            height={225}
                            className={styles.cover}
                        />
                    </div>
                )}
                <div className={styles.bookInfo}>
                    <h2 className={styles.bookTitle}>{book.title}</h2>
                    {book.author && (
                        <p className={styles.author}>{book.author}</p>
                    )}
                    {book.rating && (
                        <div className={styles.rating}>
                            {"★".repeat(book.rating)}
                            {"☆".repeat(5 - book.rating)}
                        </div>
                    )}
                    <Link
                        href={`/books/${book.id}/edit`}
                        className={styles.editLink}
                    >
                        編集する
                    </Link>
                </div>
            </div>

            {/* タブナビゲーション */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "info" ? styles.active : ""}`}
                    onClick={() => setActiveTab("info")}
                >
                    📖 基本情報
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "characters" ? styles.active : ""}`}
                    onClick={() => setActiveTab("characters")}
                >
                    👥 登場人物 ({localCharacters.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "graph" ? styles.active : ""}`}
                    onClick={() => setActiveTab("graph")}
                >
                    🔗 相関図
                </button>
            </div>

            {/* タブコンテンツ */}
            <div className={styles.tabContent}>
                {activeTab === "info" && (
                    <div className={styles.infoTab}>
                        {tags.length > 0 && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>タグ</h3>
                                <div className={styles.tags}>
                                    {tags.map((tag: Tag) => (
                                        <span
                                            key={tag.id}
                                            className={styles.tag}
                                            style={{ backgroundColor: tag.color || "#7c3aed" }}
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {emotions.length > 0 && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>読後の感情</h3>
                                <div className={styles.emotions}>
                                    {emotions.map((emotion: string) => (
                                        <span key={emotion} className={styles.emotion}>
                                            {emotion}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {book.memo && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>メモ</h3>
                                <p className={styles.memo}>{book.memo}</p>
                            </div>
                        )}

                        {book.description && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>あらすじ</h3>
                                <p className={styles.description}>{book.description}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "characters" && (
                    <div className={styles.charactersTab}>
                        <div className={styles.characterActions}>
                            <button
                                className={styles.addButton}
                                onClick={() => setModalType("addCharacter")}
                            >
                                + 新規作成
                            </button>
                            {availableCharacters.length > 0 && (
                                <button
                                    className={styles.addExistingButton}
                                    onClick={() => setModalType("addExisting")}
                                >
                                    既存から追加
                                </button>
                            )}
                        </div>
                        <CharacterList
                            characters={localCharacters}
                            attributes={localAttributes}
                            onEditCharacter={(char) => {
                                setEditingCharacter(char);
                                setModalType("editCharacter");
                            }}
                            onRemoveCharacter={handleRemoveCharacter}
                            showFilter={localCharacters.length > 3}
                        />
                    </div>
                )}

                {activeTab === "graph" && (
                    <div className={styles.graphTab}>
                        {localCharacters.length >= 2 && (
                            <button
                                className={styles.addRelationButton}
                                onClick={() => setModalType("addRelationship")}
                            >
                                + 関係を追加
                            </button>
                        )}
                        <RelationshipGraph
                            characters={localCharacters}
                            relationships={localRelationships}
                        />
                    </div>
                )}
            </div>

            {/* モーダル */}
            {modalType !== "none" && (
                <div className={styles.modalOverlay} onClick={() => setModalType("none")}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        {(modalType === "addCharacter" || modalType === "editCharacter") && (
                            <CharacterForm
                                character={editingCharacter || undefined}
                                allAttributes={localAttributes}
                                onSubmit={
                                    modalType === "editCharacter"
                                        ? handleUpdateCharacter
                                        : handleCreateCharacter
                                }
                                onCancel={() => {
                                    setModalType("none");
                                    setEditingCharacter(null);
                                }}
                                onCreateAttribute={handleCreateAttribute}
                                isLoading={isPending}
                            />
                        )}

                        {modalType === "addExisting" && (
                            <div className={styles.existingModal}>
                                <h3>既存の人物を追加</h3>
                                <p className={styles.hint}>
                                    他の本で作成した人物を追加できます
                                </p>
                                <div className={styles.existingList}>
                                    {availableCharacters.map((char) => (
                                        <button
                                            key={char.id}
                                            className={styles.existingItem}
                                            onClick={() => handleAddExistingCharacter(char.id)}
                                            disabled={isPending}
                                        >
                                            <span className={styles.existingName}>
                                                {char.name}
                                            </span>
                                            {char.nicknames && char.nicknames[0] && (
                                                <span className={styles.existingNickname}>
                                                    ({char.nicknames[0]})
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className={styles.cancelButton}
                                    onClick={() => setModalType("none")}
                                >
                                    キャンセル
                                </button>
                            </div>
                        )}

                        {modalType === "addRelationship" && (
                            <div className={styles.relationshipModal}>
                                <h3>関係を追加</h3>
                                <div className={styles.relationshipForm}>
                                    <select
                                        value={relationshipFrom}
                                        onChange={(e) => setRelationshipFrom(e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="">人物を選択...</option>
                                        {localCharacters.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <span className={styles.arrow}>→</span>
                                    <select
                                        value={relationshipTo}
                                        onChange={(e) => setRelationshipTo(e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="">人物を選択...</option>
                                        {localCharacters
                                            .filter((c) => c.id !== relationshipFrom)
                                            .map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    placeholder="関係性（親子、恋人、上司部下など）"
                                    value={relationshipType}
                                    onChange={(e) => setRelationshipType(e.target.value)}
                                    className={styles.input}
                                />
                                <div className={styles.modalActions}>
                                    <button
                                        className={styles.cancelButton}
                                        onClick={() => setModalType("none")}
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        className={styles.submitButton}
                                        onClick={handleAddRelationship}
                                        disabled={
                                            !relationshipFrom ||
                                            !relationshipTo ||
                                            !relationshipType ||
                                            isPending
                                        }
                                    >
                                        追加
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
