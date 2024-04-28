
export type TextTree = {
    type: ElementType;
    tag?: string | undefined;
    text?: string | undefined;
    styles?: TextTreeStyles | undefined;
    debug?: Node | undefined;
    children?: TextTree[] | undefined;
    parent?: TextTree | undefined;
    containerized?: boolean | undefined;
};

export type ElementType = "block" | "text";

export type TextTreeStyles = {
    border: number,
    borderRadius: number,
    weight: number,
    size: number,
    width: number
}

export type Container = {
    title: TextTree;
    container: TextTree;
}

export type FlatContainer = {
    title: string;
    content: string;
}

export interface Config {
    TITLE_THRESHOLD_FONT_SIZE: number,
    TITLE_THRESHOLD_FONT_WEIGHT: number,
    WIDTH_CHANGE_CONTAINER_THRESHOLD_PERCENT: number,
    TAG_IGNORE: Array<string>,
}
