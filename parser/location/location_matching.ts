import {MatchedLocation} from "../types.js"

//These should be loaded into memory
import countries from "./countries.json" assert {type: "json"}
import states from "./states.json" assert {type: "json"}

export const scanTextForUSLocation = (content: string[]) => {
    const arrStates = []
    let locationFound: MatchedLocation = {}

    //Convert dictionary into array
    for (const [key, state] of Object.entries(states)) {
        arrStates.push(key)
    }

    for (const text of content) {

        const split = text.split(/[ ,.]+/)

        const foundState = split.find(word => arrStates.includes(word))
        if (!foundState) continue

        const loc = text.indexOf(foundState)

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

        locationFound.state = foundState.trim()
        locationFound.city = gathered.trim()
        locationFound.country = "US"
    }
    return locationFound
}
