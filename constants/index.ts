import { Braces, Calendar, Database, Hash, Layers, Link, List, Settings, ToggleLeft, Type } from "lucide-react"

export type FieldType =
    | "string"
    | "number"
    | "boolean"
    | "Date"
    | "ObjectId"
    | "array"
    | "object"
    | "enum"
    | "mixed"
    | "Buffer"
    | "Map"
    | "Decimal128"

export interface ValidationRule {
    type: "min" | "max" | "minLength" | "maxLength" | "match" | "validate" | "custom"
    value: string | number
    message?: string
}

export interface IndexDefinition {
    fields: string[]
    type: "single" | "compound" | "text" | "2dsphere" | "hashed"
    unique?: boolean
    sparse?: boolean
    background?: boolean
}

export interface EnumValue {
    key: string
    value: string
    description?: string
}

export interface Field {
    id: string
    name: string
    type: FieldType
    required: boolean
    unique: boolean
    index?: boolean
    sparse?: boolean
    default?: string
    ref?: string
    refPath?: string
    populate?: boolean
    select?: boolean
    transform?: string
    alias?: string
    immutable?: boolean
    validation?: ValidationRule[]
    enum?: EnumValue[]
    arrayType?: FieldType
    arrayRef?: string
    arrayMinItems?: number
    arrayMaxItems?: number
    nestedFields?: Field[]
    description?: string
    example?: string
    deprecated?: boolean
    virtual?: boolean
    getter?: string
    setter?: string
    isExpanded?: boolean
}

export interface DTOSchema {
    name: string
    fields: Field[]
    imports: string[]
    enums: { name: string; values: EnumValue[]; description?: string }[]
    indexes?: IndexDefinition[]
    options: {
        timestamps: boolean
        versionKey: boolean
        collection?: string
        discriminatorKey?: string
        strict: boolean
        validateBeforeSave: boolean
        autoIndex: boolean
    }
    hooks: {
        pre: string[]
        post: string[]
    }
    virtuals: string[]
    methods: string[]
    statics: string[]
}

export const FIELD_TYPE_ICONS = {
    string: Type,
    number: Hash,
    boolean: ToggleLeft,
    Date: Calendar,
    ObjectId: Link,
    array: List,
    object: Braces,
    enum: Settings,
    mixed: Layers,
    Buffer: Database,
    Map: Braces,
    Decimal128: Hash,
}

export const FIELD_TYPE_COLORS = {
    string: "bg-blue-100 text-blue-800 border-blue-200",
    number: "bg-green-100 text-green-800 border-green-200",
    boolean: "bg-purple-100 text-purple-800 border-purple-200",
    Date: "bg-orange-100 text-orange-800 border-orange-200",
    ObjectId: "bg-red-100 text-red-800 border-red-200",
    array: "bg-yellow-100 text-yellow-800 border-yellow-200",
    object: "bg-indigo-100 text-indigo-800 border-indigo-200",
    enum: "bg-pink-100 text-pink-800 border-pink-200",
    mixed: "bg-gray-100 text-gray-800 border-gray-200",
    Buffer: "bg-cyan-100 text-cyan-800 border-cyan-200",
    Map: "bg-teal-100 text-teal-800 border-teal-200",
    Decimal128: "bg-emerald-100 text-emerald-800 border-emerald-200",
}