"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./gallery.module.css";
const concepts = [
 { id: "A", title: "웜 오렌지 비교형", description: "지금의 따뜻한 분위기를 살리면서 검색과 가격 비교를 앞에 둡니다.", tags: ["친숙한 브랜드 톤", "균형 잡힌 카드", "모바일 가로 카드"], image: "/design-previews/a-warm-comparison.png", color: "#de591d" },
 { id: "B", title: "딥 그린 셀렉션", description: "짙은 녹색과 크림색으로 병과 제품 정보를 돋보이게 합니다.", tags: ["프리미엄 분위기", "선명한 대비", "제품 이미지 중심"], image: "/design-previews/b-green-selection.png", color: "#173c31" },
 { id: "C", title: "빠른 비교형", description: "목록과 정렬 중심으로 여러 상품의 가격을 빠르게 훑어봅니다.", tags: ["높은 정보 밀도", "가격 중심 목록", "필터와 정렬 강조"], image: "/design-previews/c-quick-comparison.png", color: "#1554e8" },
];
export default function DesignGallery() {
 const [selected, setSelected] = useState(0);
 const [compare, setCompare] = useState(false);
 const [expanded, setExpanded] = useState(0);
 const dialog = useRef<HTMLDialogElement>(null);
 const active = concepts[selected];
 function enlarge(index: number) { setExpanded(index); dialog.current?.showModal(); }
 return <main className={styles.page}>
  <header className={styles.header}><Link href="/" className={styles.brand}>위스키다모아 <span>DESIGN STUDIO</span></Link><Link href="/" className={styles.back}>현재 사이트 보기 ↗</Link></header>
  <section className={styles.intro}><p className={styles.eyebrow}>RENEWAL CONCEPTS · 01—03</p><h1>어떤 위스키다모아가<br />마음에 드세요?</h1><p>같은 가격 비교 서비스, 세 가지 다른 인상.<br />데스크톱과 모바일 디자인을 함께 비교해 보세요.</p></section>
  <div className={styles.toolbar}><div className={styles.tabs} aria-label="시안 선택">{concepts.map((item,index)=><button key={item.id} type="button" aria-pressed={selected===index} onClick={()=>{setSelected(index);setCompare(false);}}><span style={{background:item.color}} />{item.id}<span className={styles.tabTitle}> · {item.title}</span></button>)}</div><button className={styles.mode} type="button" aria-pressed={compare} onClick={()=>setCompare(!compare)}>{compare ? "선택한 시안 크게 보기" : "세 가지 나란히 비교"}</button></div>
  {compare ? <section className={styles.grid} aria-label="세 가지 시안 비교">{concepts.map((item,index)=><article key={item.id} className={styles.card}><button type="button" className={styles.imageButton} onClick={()=>enlarge(index)} aria-label={item.id+" 시안 확대"}><Image src={item.image} alt={item.title+" PC·모바일 시안"} width={1536} height={1024} sizes="(max-width: 900px) 100vw, 33vw" unoptimized /></button><div className={styles.cardBody}><h2>{item.id} · {item.title}</h2><p>{item.description}</p><button type="button" className={styles.textButton} onClick={()=>{setSelected(index);setCompare(false);}}>이 시안 크게 보기 ↗</button></div></article>)}</section> : <section className={styles.stage} aria-label="선택한 디자인 시안"><div className={styles.stageHeading}><div><p className={styles.eyebrow}>CONCEPT {active.id}</p><h2>{active.title}</h2><p>{active.description}</p></div><div className={styles.actions}><button type="button" onClick={()=>enlarge(selected)}>확대 보기 ⤢</button><a href={active.image} download>이미지 저장 ↓</a></div></div><button type="button" className={styles.imageButton} onClick={()=>enlarge(selected)} aria-label={active.id+" 시안 확대"}><Image src={active.image} alt={active.title+" PC·모바일 전체 화면 디자인 시안"} width={1536} height={1024} sizes="100vw" priority unoptimized /></button><ul className={styles.tags}>{active.tags.map(tag=><li key={tag}>{tag}</li>)}</ul></section>}
  <aside className={styles.note}><strong>디자인 방향을 비교하는 이미지 시안입니다.</strong><p>이미지 안의 검색·필터·메뉴는 동작하지 않습니다. 상품, 가격, 문구와 일부 메뉴는 예시이며 실제 구현 범위는 별도로 정합니다.</p></aside>
  <footer className={styles.footer}>추천 조합: A의 따뜻한 색감 + C의 빠른 비교 구조.</footer>
  <dialog ref={dialog} className={styles.dialog} aria-labelledby="expanded-title"><div className={styles.dialogHeader}><h2 id="expanded-title">{concepts[expanded].id} · {concepts[expanded].title}</h2><div className={styles.actions}><a href={concepts[expanded].image} target="_blank" rel="noreferrer">원본 열기 ↗</a><button type="button" autoFocus onClick={()=>dialog.current?.close()}>닫기 ✕</button></div></div><div className={styles.zoom}><Image src={concepts[expanded].image} alt={concepts[expanded].title+" 확대 이미지"} width={1536} height={1024} unoptimized /></div></dialog>
 </main>;
}
