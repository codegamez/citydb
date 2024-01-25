import useOpenAI from './helpers/openai'
import { v2 } from '@google-cloud/translate'
const { Translate } = v2;

const CHUNK_SIZE = 100

const openai = useOpenAI()
const translate = new Translate();
translate.key = Bun.env.GOOGLE_TRANSLATE_API_KEY

async function translateText(text: string[], target: string) {
    let [translation] = await translate.translate(text, target);
    return translation
}


function containsPersian(text: string) {
    var persianRegex = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return persianRegex.test(text);
}

const originFile = Bun.file("countries+states+cities.json")
const translationFile = Bun.file('csc_persian_translations.json')

const citydb = await originFile.json()

const translations = await translationFile.json()
translations.countries = translations.countries || {}
translations.states = translations.states || {}
translations.cities = translations.cities || {}

if (!Object.keys(translations.countries)) {
    translations.countries = Object.fromEntries(citydb.map((v: any) => [v.id, v.translations.fa || v.name]))
}
if (!Object.keys(translations.states)) {
    translations.states = Object.fromEntries(citydb.map((v: any) => v.states).flat().map((v: any) => [v.id, v.name]))
}
if (!Object.keys(translations.cities)) {
    translations.cities = Object.fromEntries(citydb.map((v: any) => v.states.map((s: any) => s.cities).flat()).flat().map((v: any) => [v.id, v.name]))
}

let updatedCount = 0

const stateIds = Object.keys(translations.states)
console.log('Updated: ' + updatedCount + '\r')
for (let i = 0; i <= Math.floor(stateIds.length / CHUNK_SIZE); i++) {

    const chunkIds = stateIds.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    const items = chunkIds.filter(k => k && Number(k) > 5143).map(k => [k, translations.states[k]]).filter(v => v[1] && !containsPersian(v[1]))
    if (!items.length) continue
    const newTranslations = await translateText(items.map(v => v[1]), 'fa')

    newTranslations.forEach((v, i) => {
        translations.states[items[i][0]] = v
    })

    updatedCount += items.length
    await Bun.write(translationFile, JSON.stringify(translations))
    console.log('Updated: ' + updatedCount + '\r')
}
console.log('Updated: ' + updatedCount)


const cityIds = Object.keys(translations.cities)
console.log('Updated: ' + updatedCount + '\r')
for (let i = 0; i <= Math.floor(cityIds.length / CHUNK_SIZE); i++) {

    const chunkIds = cityIds.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    const items = chunkIds.filter(k => k).map(k => [k, translations.cities[k]]).filter(v => v[1] && !containsPersian(v[1]))
    if (!items.length) continue
    const newTranslations = await translateText(items.map(v => v[1]), 'fa')

    newTranslations.forEach((v, i) => {
        translations.cities[items[i][0]] = v
    })

    updatedCount += items.length
    await Bun.write(translationFile, JSON.stringify(translations))
    console.log('Updated: ' + updatedCount + '\r')
}
console.log('Updated: ' + updatedCount)

await Bun.write(translationFile, JSON.stringify(translations))