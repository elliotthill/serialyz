export type TextTree = {
    type: ElementType
    tag?: string | undefined
    link?: string | undefined
    src?: string | undefined
    text?: string | undefined
    styles?: TextTreeStyles | undefined
    debug?: Node | undefined
    children?: TextTree[] | undefined
    parent?: TextTree | undefined
    containerized?: boolean | undefined
    specialParent?: string | undefined //Used to indicate whether this element is under a <li>
}

export type ElementType = "block" | "text"

export type TextTreeStyles = {
    border: number
    borderRadius: number
    boxShadow: boolean
    weight: number
    size: number
    width: number
    titleScore?: number //Font size in px + (1px for every 100 weight over 400(set in conf))
    top: number
    left: number
    height?: number
}

export type Container = {
    title: TextTree
    container: TextTree
}

export type FlatContainer = {
    title: string
    content: Array<string>
    link?: string | undefined
    image?: string | undefined
    location?: MatchedLocation
}

export interface Config {
    TITLE_THRESHOLD_FONT_SIZE: number
    TITLE_THRESHOLD_FONT_WEIGHT: number
    WIDTH_CHANGE_CONTAINER_THRESHOLD_PERCENT: number
    TAG_IGNORE: Array<string>
}

export type ImagesWidths = {
    src: string
    width: number
}

export type MatchedLocation = {
    city?: string
    state?: string
    stateFull?: string
    country?: string
    countryCode: string
}
