# Contrato EGEN — fatos p/ recriação HTML

Fonte: uploads/C9840- EGEN GERADORES -.docx. Conteúdo completo por parágrafo: extracted/outline.txt (¶[meta] texto; <B>=bold <I>=italic ⇥=tab ↵=br; num=2/0→"N." nível1, 2/1→"N.M", 2/2→bullet "-", num=3/0→"a)").

## Página
- A4 (210×297mm). Margens: top 1985tw≈3,5cm; left/right 720tw=1,27cm; bottom 567tw=1cm. Header offset 709tw; footer 224tw.
- Fonte padrão: tema (Calibri), 11pt. Corpo justificado (jc=both), line-height 278/240≈1.16.

## Header (todas as páginas)
- Faixa retangular AZUL MARINHO sólida #102A65, largura total da página (sangra), altura ≈93.35pt (~124px), começa no topo da página (margin-top -36.85pt do parágrafo do header).
- Logo EGEN = extracted/media/image1.png (wordmark branco, visível sobre navy), ≈96×80pt (128×107px), à esquerda (~7pt da margem).
- Texto branco (FFFFFF) alinhado à direita, 2 linhas: "Goiânia, 25 de junho de 2026" e "Contrato de Locação nº C9840".

## Footer (todas as páginas)
- Faixa gradiente = extracted/media/image2.png (amarelo→azul→verde, com @egengeradores / egengeradores.com.br), largura total sangrada, ≈682×28pt (9.47in×0.39in), no rodapé.
- Acima da faixa, à direita: "Página X de Y" Arial 10pt branco... (fica sobre a faixa; color FFFFFF).

## Numeração
- num2 abstract0: lvl0 decimal "%1." ind L381 H222 (títulos de cláusula, bold, caixa alta); lvl1 "%1.%2" ind L180 H351 (subcláusulas); lvl2 bullet "-" L302 H122 (lista de anexos).
- num3 abstract1: lvl0 lowerLetter "%1)" L786 H360 (a,b,c em RESCISÃO 9.1).
- Seções lvl0 na ordem: 1 Pelo presente instrumento... / 2 OBJETO DO CONTRATO E DOCUMENTOS / 3 PRAZO DA LOCAÇÃO / 4 VALOR E FORMA DE PAGAMENTO / 5 OBRIGAÇÕES DA LOCADORA / 6 OBRIGAÇÕES DA LOCATÁRIA / 7 MANUTENÇÕES E SUPORTE / 8 DO INADIPLIMENTO / 9 RESCISÃO DA LOCAÇÃO / 10 DISPOSIÇÕES GERAIS / 11 FORO.
- Parágrafos "§ ..." sem numeração, recuados (L709 / L851), o de 4.3 em itálico.

## Fim do doc
- Data à direita: "Goiânia, 25 de junho de 2026" (preto).
- Linhas de assinatura: LOCADORA / LOCATÁRIA / Testemunha 1 / Testemunha 2 (ver outline.txt).

## Plano
- DC único "Contrato EGEN.dc.html" usando doc_page.js (<doc-page size="a4">, margin 0) com header/footer em slot="header"/"footer" repetindo por página; corpo com CSS counters? NÃO — inline styles; numerar manualmente (1., 1.1 etc. já conhecidos) com hanging indent via display:flex ou text-indent.
- Copiar imagens p/ assets/: logo-egen.png (image1), rodape-egen.png (image2).
