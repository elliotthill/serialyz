import { MatchedLocation } from "../types.js"

//These should be loaded into memory
import countries from "./countries.json" assert {type: "json"}
import states from "./states.json" assert {type: "json"}

/*
 * This needs to be cleaned up
 */
export const scanTextForUSLocation = (content: string[]) => {
    const arrCodes = []
    const arrStates = []
    let stateCodeToFullHash = {}
    let stateFullToCodeHash = {}
    let locationFound: MatchedLocation = {}

    //Convert dictionary into array
    for (const [key, state] of Object.entries(states)) {
        arrCodes.push(key)
        arrStates.push(state)
        stateCodeToFullHash[key] = state
        stateFullToCodeHash[state] = key
    }

    for (const text of content) {
        let foundFullState = false
        const split = text.split(/[ ,.]+/)

        let foundState = split.find(word => arrCodes.includes(word))

        if (!foundState) {
            //Try looking for the full state name
            foundState = arrStates.find(word => text.includes(word))
            foundFullState = true
        }

        if (!foundState) continue

        const loc = text.lastIndexOf(foundState)

        //Gather up all text up to this loc
        let i = loc - 2
        let gathered = ""
        let hitAlpha = false
        while (i > -1) {
            const alpha = /^[a-zA-Z]+$/.test(text[i])
            if (alpha) hitAlpha = true

            if (hitAlpha && [".", ",", "-"].includes(text[i])) break

            if (alpha || hitAlpha) gathered = text[i] + gathered

            i--
        }

        if (foundFullState) {
            locationFound.stateFull = foundState.trim()
            locationFound.state = stateFullToCodeHash[foundState.trim()]
        } else {
            locationFound.state = foundState.trim()
            locationFound.stateFull = stateCodeToFullHash[foundState.trim()]
        }
        locationFound.city = gathered.trim()
        locationFound.country = "United States"
        locationFound.countryCode = "US"
        return locationFound
    }
    return undefined
}

export const scanTextForCountryLocation = (content: string[]) => {
    const arrCountries = []
    const countryCodeHash = {}
    let locationFound: MatchedLocation = {}

    //Convert dictionary into array
    for (const { name, code } of countries) {
        arrCountries.push(name)
        countryCodeHash[name] = code
    }

    for (const text of content) {
        const foundCountry = arrCountries.find(country => text.includes(country))

        if (!foundCountry) continue
        const loc = text.indexOf(foundCountry)

        //Gather up all text up to this loc
        let i = loc - 1
        let gathered = ""
        let hitAlpha = false
        while (i > -1) {
            const alpha = /^[a-zA-Z]+$/.test(text[i])
            if (alpha) hitAlpha = true

            if (hitAlpha && [".", ",", "-"].includes(text[i])) break

            if (alpha || hitAlpha) gathered = text[i] + gathered

            i--
        }

        locationFound.city = gathered.trim()
        locationFound.countryCode = countryCodeHash[foundCountry.trim()]
        locationFound.country = foundCountry.trim()
        return locationFound
    }

    return undefined
}
