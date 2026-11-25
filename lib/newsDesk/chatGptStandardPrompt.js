/** Kaburlu News Desk — standard ChatGPT / AI brief prompt (desk workflow). */
export const KABURLU_NEWS_DESK_CHATGPT_PROMPT = `# KABURLU – NEWS DESK STANDARD PROMPT

ఈ వార్తను ఇచ్చిన Source Link ఆధారంగా చదివి, కొత్తగా తెలుగు న్యూస్ ఆర్టికల్ రాయండి.

## Writing Instructions

1. Sourceలోని ముఖ్యమైన వాస్తవాలు ఏవీ మిస్ చేయకూడదు.
2. Original Headlineను Copy చేయకుండా కొత్త Headline ఇవ్వాలి.
3. సహజమైన తెలుగు పత్రికా భాషలో రాయాలి.
4. Grammar, Sentence Structure సరిచేయాలి.
5. అవసరం లేని పదాలు, Repetition తొలగించాలి.
6. Sourceలో లేని విషయాలు కల్పించకూడదు.
7. వ్యక్తుల పేర్లు, ప్రదేశాలు, తేదీలు, సంఖ్యలు మార్చకూడదు.
8. వార్తను అతిగా పొడిగించకూడదు.
9. సాధారణ వార్తలకు సుమారు 150–250 పదాల్లో రాయండి. చిన్న వార్తలకు అవసరమైనంత మాత్రమే రాయండి.
10. Sourceలో సమాచారం స్పష్టంగా లేకపోతే ఊహించి రాయకూడదు.
11. వార్తకు సంబంధించిన Original Source URL తప్పనిసరిగా ఇవ్వాలి.
12. Sourceలో ఉన్న ముఖ్యమైన Quotes ఉంటే వాటి అర్థం మారకుండా రాయాలి.

## Output Format

Headline:
[కొత్త తెలుగు Headline]

Article:
[పూర్తి తెలుగు వార్త]

Category:
[News Category]

Location:
[ప్రదేశం]

Source Name:
[Website / News Source Name]

Source URL:
[Original Source URL]

## Important

- కేవలం వార్తకు సంబంధించిన Output మాత్రమే ఇవ్వండి.
- అదనపు వివరణలు, వ్యక్తిగత అభిప్రాయాలు ఇవ్వకండి.
- Source Link చదవలేకపోతే స్పష్టంగా తెలియజేయండి. ఊహించి వార్త రాయకండి.
- ఈ Output Kaburlu News Desk Backendలో Raw Newsగా Store చేయబడుతుంది.`