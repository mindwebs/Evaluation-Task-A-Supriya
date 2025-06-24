"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "./Header";
import { DTOSchema, Field, FIELD_TYPE_COLORS, FIELD_TYPE_ICONS, FieldType } from "@/constants";
import { useCallback, useState } from "react";
import { ChevronDown, ChevronRight, Code, Copy, Database, Download, Eye, FileText, Layers, Plus, RefreshCw, Settings, TestTube, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { copyToClipboard, downloadFile, findFieldById, generateMongooseFieldDefinition, generateTypeScriptType, updateNestedFields } from "../_functions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

export default function DtoMaker() {
    const [schema, setSchema] = useState<DTOSchema>({
        name: "User",
        fields: [],
        imports: [],
        enums: [],
        indexes: [],
        options: {
            timestamps: true,
            versionKey: false,
            strict: true,
            validateBeforeSave: true,
            autoIndex: true,
        },
        hooks: { pre: [], post: [] },
        virtuals: [],
        methods: [],
        statics: [],
    })

    const [generatedDTO, setGeneratedDTO] = useState("")
    const [generatedSchema, setGeneratedSchema] = useState("")
    const [activeTab, setActiveTab] = useState("builder")
    const [showAdvanced, setShowAdvanced] = useState(false)

    const addField = useCallback(
        (parentFields?: Field[]) => {
            const targetFields = parentFields || schema.fields
            const newField: Field = {
                id: Math.random().toString(36).substr(2, 9),
                name: "",
                type: "string",
                required: false,
                unique: false,
                isExpanded: true,
            }

            if (parentFields) {
                const newFields = [...targetFields, newField]
                setSchema((prev) => ({
                    ...prev,
                    fields: updateNestedFields(prev.fields, parentFields, newFields),
                }))
            } else {
                setSchema((prev) => ({
                    ...prev,
                    fields: [...prev.fields, newField],
                }))
            }
        },
        [schema.fields],
    )

    const removeField = useCallback((fieldId: string, parentFields?: Field[]) => {
        if (parentFields) {
            const newFields = parentFields.filter((f) => f.id !== fieldId)
            setSchema((prev) => ({
                ...prev,
                fields: updateNestedFields(prev.fields, parentFields, newFields),
            }))
        } else {
            setSchema((prev) => ({
                ...prev,
                fields: prev.fields.filter((f) => f.id !== fieldId),
            }))
        }
    }, [])

    const updateField = useCallback((fieldId: string, updates: Partial<Field>, parentFields?: Field[]) => {
        const updateFieldInArray = (fields: Field[]): Field[] => {
            return fields.map((field) => {
                if (field.id === fieldId) {
                    const updatedField = { ...field, ...updates }
                    if (updates.type === "object" && !updatedField.nestedFields) {
                        updatedField.nestedFields = []
                    }
                    if (updates.type === "enum" && !updatedField.enum) {
                        updatedField.enum = [{ key: "", value: "" }]
                    }
                    if (updates.type === "array" && updates.arrayType === "object" && !updatedField.nestedFields) {
                        updatedField.nestedFields = []
                    }
                    return updatedField
                }
                if (field.nestedFields) {
                    return { ...field, nestedFields: updateFieldInArray(field.nestedFields) }
                }
                return field
            })
        }

        setSchema((prev) => ({
            ...prev,
            fields: updateFieldInArray(prev.fields),
        }))
    }, [])

    const toggleFieldExpansion = useCallback(
        (fieldId: string) => {
            updateField(fieldId, { isExpanded: !findFieldById(fieldId, schema.fields)?.isExpanded })
        },
        [schema.fields, updateField],
    )

    const renderField = (field: Field, parentFields?: Field[], depth = 0) => {
        const IconComponent = FIELD_TYPE_ICONS[field.type]
        const colorClass = FIELD_TYPE_COLORS[field.type]

        return (
            <Card key={field.id} className={`mb-4 ${depth > 0 ? "ml-4 border-l-4 border-l-blue-200" : ""}`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={() => toggleFieldExpansion(field.id)} className="p-1">
                                {field.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>

                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${colorClass} flex items-center gap-1`}>
                                    <IconComponent className="h-3 w-3" />
                                    {field.type}
                                </Badge>

                                <Input
                                    placeholder="Field name"
                                    value={field.name}
                                    onChange={(e) => updateField(field.id, { name: e.target.value }, parentFields)}
                                    className="w-40 h-8"
                                />

                                <Select
                                    value={field.type}
                                    onValueChange={(value: FieldType) => updateField(field.id, { type: value }, parentFields)}
                                >
                                    <SelectTrigger className="w-32 h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="string">String</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="boolean">Boolean</SelectItem>
                                        <SelectItem value="Date">Date</SelectItem>
                                        <SelectItem value="ObjectId">ObjectId</SelectItem>
                                        <SelectItem value="Buffer">Buffer</SelectItem>
                                        <SelectItem value="Map">Map</SelectItem>
                                        <SelectItem value="Decimal128">Decimal128</SelectItem>
                                        <SelectItem value="array">Array</SelectItem>
                                        <SelectItem value="object">Object</SelectItem>
                                        <SelectItem value="enum">Enum</SelectItem>
                                        <SelectItem value="mixed">Mixed</SelectItem>
                                    </SelectContent>
                                </Select>

                                {field.required && (
                                    <Badge variant="destructive" className="text-xs">
                                        Required
                                    </Badge>
                                )}
                                {field.unique && (
                                    <Badge variant="secondary" className="text-xs">
                                        Unique
                                    </Badge>
                                )}
                                {field.deprecated && (
                                    <Badge variant="outline" className="text-xs text-orange-600">
                                        Deprecated
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {field.description && (
                                <Badge variant="outline" className="text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Documented
                                </Badge>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => removeField(field.id, parentFields)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <Collapsible open={field.isExpanded} onOpenChange={() => toggleFieldExpansion(field.id)}>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {/* Basic Properties */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`required-${field.id}`}
                                        checked={field.required}
                                        onCheckedChange={(checked) => updateField(field.id, { required: !!checked }, parentFields)}
                                    />
                                    <Label htmlFor={`required-${field.id}`}>Required</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`unique-${field.id}`}
                                        checked={field.unique}
                                        onCheckedChange={(checked) => updateField(field.id, { unique: !!checked }, parentFields)}
                                    />
                                    <Label htmlFor={`unique-${field.id}`}>Unique</Label>
                                </div>
                            </div>

                            {/* Advanced Properties */}
                            {showAdvanced && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`index-${field.id}`}
                                            checked={field.index}
                                            onCheckedChange={(checked) => updateField(field.id, { index: !!checked }, parentFields)}
                                        />
                                        <Label htmlFor={`index-${field.id}`}>Index</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`sparse-${field.id}`}
                                            checked={field.sparse}
                                            onCheckedChange={(checked) => updateField(field.id, { sparse: !!checked }, parentFields)}
                                        />
                                        <Label htmlFor={`sparse-${field.id}`}>Sparse</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`immutable-${field.id}`}
                                            checked={field.immutable}
                                            onCheckedChange={(checked) => updateField(field.id, { immutable: !!checked }, parentFields)}
                                        />
                                        <Label htmlFor={`immutable-${field.id}`}>Immutable</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`deprecated-${field.id}`}
                                            checked={field.deprecated}
                                            onCheckedChange={(checked) => updateField(field.id, { deprecated: !!checked }, parentFields)}
                                        />
                                        <Label htmlFor={`deprecated-${field.id}`}>Deprecated</Label>
                                    </div>
                                </div>
                            )}

                            {/* Field Configuration */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Default Value</Label>
                                    <Input
                                        placeholder="Default value"
                                        value={field.default || ""}
                                        onChange={(e) => updateField(field.id, { default: e.target.value }, parentFields)}
                                    />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        placeholder="Field description"
                                        value={field.description || ""}
                                        onChange={(e) => updateField(field.id, { description: e.target.value }, parentFields)}
                                    />
                                </div>
                            </div>

                            {showAdvanced && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Alias</Label>
                                        <Input
                                            placeholder="Field alias"
                                            value={field.alias || ""}
                                            onChange={(e) => updateField(field.id, { alias: e.target.value }, parentFields)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Example</Label>
                                        <Input
                                            placeholder="Example value"
                                            value={field.example || ""}
                                            onChange={(e) => updateField(field.id, { example: e.target.value }, parentFields)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Type-specific configurations */}
                            {field.type === "ObjectId" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Reference</Label>
                                        <Input
                                            placeholder="Model reference (e.g., User)"
                                            value={field.ref || ""}
                                            onChange={(e) => updateField(field.id, { ref: e.target.value }, parentFields)}
                                        />
                                    </div>
                                    {showAdvanced && (
                                        <div>
                                            <Label>Reference Path</Label>
                                            <Input
                                                placeholder="Dynamic reference path"
                                                value={field.refPath || ""}
                                                onChange={(e) => updateField(field.id, { refPath: e.target.value }, parentFields)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Array Configuration */}
                            {field.type === "array" && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Array Type</Label>
                                            <Select
                                                value={field.arrayType || "string"}
                                                onValueChange={(value: FieldType) => updateField(field.id, { arrayType: value }, parentFields)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="string">String</SelectItem>
                                                    <SelectItem value="number">Number</SelectItem>
                                                    <SelectItem value="boolean">Boolean</SelectItem>
                                                    <SelectItem value="Date">Date</SelectItem>
                                                    <SelectItem value="ObjectId">ObjectId</SelectItem>
                                                    <SelectItem value="object">Object</SelectItem>
                                                    <SelectItem value="mixed">Mixed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {field.arrayType === "ObjectId" && (
                                            <div>
                                                <Label>Array Reference</Label>
                                                <Input
                                                    placeholder="Model reference"
                                                    value={field.arrayRef || ""}
                                                    onChange={(e) => updateField(field.id, { arrayRef: e.target.value }, parentFields)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {showAdvanced && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Min Items</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Minimum items"
                                                    value={field.arrayMinItems || ""}
                                                    onChange={(e) =>
                                                        updateField(
                                                            field.id,
                                                            { arrayMinItems: e.target.value ? Number.parseInt(e.target.value) : undefined },
                                                            parentFields,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Max Items</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Maximum items"
                                                    value={field.arrayMaxItems || ""}
                                                    onChange={(e) =>
                                                        updateField(
                                                            field.id,
                                                            { arrayMaxItems: e.target.value ? Number.parseInt(e.target.value) : undefined },
                                                            parentFields,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {field.arrayType === "object" && (
                                        <div className="border rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-center justify-between mb-4">
                                                <Label className="text-sm font-medium">Array Object Fields</Label>
                                                <Button variant="outline" size="sm" onClick={() => addField(field.nestedFields)}>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Field
                                                </Button>
                                            </div>
                                            <div className="space-y-4">
                                                {field.nestedFields?.map((nestedField) =>
                                                    renderField(nestedField, field.nestedFields, depth + 1),
                                                )}
                                                {(!field.nestedFields || field.nestedFields.length === 0) && (
                                                    <p className="text-sm text-muted-foreground text-center py-4">
                                                        No nested fields. Click "Add Field" to add object properties.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Object Configuration */}
                            {field.type === "object" && (
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <Label className="text-sm font-medium">Object Fields</Label>
                                        <Button variant="outline" size="sm" onClick={() => addField(field.nestedFields)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Field
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        {field.nestedFields?.map((nestedField) => renderField(nestedField, field.nestedFields, depth + 1))}
                                        {(!field.nestedFields || field.nestedFields.length === 0) && (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No nested fields. Click "Add Field" to add object properties.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Enum Configuration */}
                            {field.type === "enum" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Enum Values</Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const currentEnum = field.enum || []
                                                updateField(field.id, { enum: [...currentEnum, { key: "", value: "" }] }, parentFields)
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Value
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {field.enum?.map((enumValue, index) => (
                                            <div key={index} className="grid grid-cols-2 gap-2">
                                                <Input
                                                    placeholder="Key (e.g., ACTIVE)"
                                                    value={enumValue.key}
                                                    onChange={(e) => {
                                                        const newEnum = [...(field.enum || [])]
                                                        newEnum[index] = { ...newEnum[index], key: e.target.value }
                                                        updateField(field.id, { enum: newEnum }, parentFields)
                                                    }}
                                                />
                                                <Input
                                                    placeholder="Value (e.g., active)"
                                                    value={enumValue.value}
                                                    onChange={(e) => {
                                                        const newEnum = [...(field.enum || [])]
                                                        newEnum[index] = { ...newEnum[index], value: e.target.value }
                                                        updateField(field.id, { enum: newEnum }, parentFields)
                                                    }}
                                                />
                                            </div>
                                        ))}
                                        {(!field.enum || field.enum.length === 0) && (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No enum values. Click "Add Value" to add enum options.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        )
    }

    const generateDTO = () => {
        const imports = ['import { Document, Types } from "mongoose";']

        //for custom imports
        schema.imports.forEach((imp) => {
            if (imp.trim()) imports.push(imp)
        })

        // enums
        const enumDefinitions = schema.fields
            .filter((f) => f.type === "enum" && f.enum)
            .map((field) => {
                const enumName = field.name.charAt(0).toUpperCase() + field.name.slice(1) + "Enum"
                const values = field.enum!.map((e) => `  ${e.key} = "${e.value}"`).join(",\n")
                return `enum ${enumName} {\n${values}\n}`
            })

        // interfaces for nested objects
        const generateNestedInterfaces = (fields: Field[], prefix = ""): string[] => {
            const interfaces: string[] = []

            fields.forEach((field) => {
                if (field.type === "object" && field.nestedFields) {
                    const interfaceName = `${prefix}${field.name.charAt(0).toUpperCase() + field.name.slice(1)}Type`
                    const interfaceFields = field.nestedFields
                        .map(
                            (f) =>
                                `  ${f.name}${f.required ? "" : "?"}: ${generateTypeScriptType(f)};${f.description ? ` // ${f.description}` : ""}`,
                        )
                        .join("\n")

                    interfaces.push(`interface ${interfaceName} {\n${interfaceFields}\n}`)

                    interfaces.push(...generateNestedInterfaces(field.nestedFields, interfaceName))
                }

                if (field.type === "array" && field.arrayType === "object" && field.nestedFields) {
                    const interfaceName = `${prefix}${field.name.charAt(0).toUpperCase() + field.name.slice(1)}ItemType`
                    const interfaceFields = field.nestedFields
                        .map(
                            (f) =>
                                `  ${f.name}${f.required ? "" : "?"}: ${generateTypeScriptType(f)};${f.description ? ` // ${f.description}` : ""}`,
                        )
                        .join("\n")

                    interfaces.push(`interface ${interfaceName} {\n${interfaceFields}\n}`)

                    interfaces.push(...generateNestedInterfaces(field.nestedFields, interfaceName))
                }
            })

            return interfaces
        }

        const nestedInterfaces = generateNestedInterfaces(schema.fields, schema.name)

        // main type
        const typeDefinition = `type ${schema.name}Dto = {\n${schema.fields
            .map(
                (field) =>
                    `  ${field.name}${field.required ? "" : "?"}: ${generateTypeScriptType(field)};${field.description ? ` // ${field.description}` : ""}${field.deprecated ? " @deprecated" : ""}`,
            )
            .join("\n")}\n};`

        // derived types
        const derivedTypes = [
            `type ${schema.name}SchemaDto = ${schema.name}Dto & Document;`,
            `type Create${schema.name}Dto = Omit<${schema.name}Dto, '_id' | 'createdAt' | 'updatedAt'>;`,
            `type Update${schema.name}Dto = Partial<Create${schema.name}Dto>;`,
            `type ${schema.name}PopulatedDto = ${schema.name}Dto; // Add populated field types as needed`,
        ]

        //exports
        const exports = [
            `${schema.name}Dto`,
            `${schema.name}SchemaDto`,
            `Create${schema.name}Dto`,
            `Update${schema.name}Dto`,
            `${schema.name}PopulatedDto`,
            ...schema.fields
                .filter((f) => f.type === "enum")
                .map((f) => f.name.charAt(0).toUpperCase() + f.name.slice(1) + "Enum"),
        ]

        const exportStatement = `export {\n  ${exports.join(",\n  ")}\n};`

        return [
            imports.join("\n"),
            "",
            enumDefinitions.join("\n\n"),
            enumDefinitions.length > 0 ? "" : "",
            nestedInterfaces.join("\n\n"),
            nestedInterfaces.length > 0 ? "" : "",
            typeDefinition,
            "",
            derivedTypes.join("\n"),
            "",
            exportStatement,
        ]
            .filter((line) => line !== null)
            .join("\n")
    }

    const generateMongooseSchema = () => {
        const imports = [
            `import { Model, Schema, model } from "mongoose";`,
            `import { ${schema.name}SchemaDto${schema.fields.some((f) => f.type === "enum")
                ? ", " +
                schema.fields
                    .filter((f) => f.type === "enum")
                    .map((f) => f.name.charAt(0).toUpperCase() + f.name.slice(1) + "Enum")
                    .join(", ")
                : ""
            } } from "../dtos/${schema.name.toLowerCase()}.dto";`,
        ]

        const schemaDefinition = `const ${schema.name}Schema = new Schema<${schema.name}SchemaDto>(
      {
    ${schema.fields.map((field) => `    ${field.name}: ${generateMongooseFieldDefinition(field)}`).join(",\n")}
      },
      {
        timestamps: ${schema.options.timestamps},
        versionKey: ${schema.options.versionKey},
        strict: ${schema.options.strict},
        validateBeforeSave: ${schema.options.validateBeforeSave},
        autoIndex: ${schema.options.autoIndex},${schema.options.collection ? `\n    collection: "${schema.options.collection}",` : ""}${schema.options.discriminatorKey ? `\n    discriminatorKey: "${schema.options.discriminatorKey}",` : ""}
      }
    );`

        // Add indexes
        const indexDefinitions =
            schema.indexes
                ?.map((index) => {
                    const fields =
                        index.fields.length === 1
                            ? `{ ${index.fields[0]}: 1 }`
                            : `{ ${index.fields.map((f) => `${f}: 1`).join(", ")} }`

                    const options = []
                    if (index.unique) options.push("unique: true")
                    if (index.sparse) options.push("sparse: true")
                    if (index.background) options.push("background: true")

                    const optionsStr = options.length > 0 ? `, { ${options.join(", ")} }` : ""

                    return `${schema.name}Schema.index(${fields}${optionsStr});`
                })
                .join("\n") || ""

        // Add virtuals
        const virtualDefinitions = schema.virtuals
            .map((virtual) => `${schema.name}Schema.virtual('${virtual}').get(function() {\n  // Add virtual logic here\n});`)
            .join("\n\n")

        // Add methods
        const methodDefinitions = schema.methods
            .map((method) => `${schema.name}Schema.methods.${method} = function() {\n  // Add method logic here\n};`)
            .join("\n\n")

        // Add statics
        const staticDefinitions = schema.statics
            .map(
                (staticMethod) =>
                    `${schema.name}Schema.statics.${staticMethod} = function() {\n  // Add static method logic here\n};`,
            )
            .join("\n\n")

        // Add hooks
        const hookDefinitions = [
            ...schema.hooks.pre.map(
                (hook) => `${schema.name}Schema.pre('${hook}', function(next) {\n  // Add pre-hook logic here\n  next();\n});`,
            ),
            ...schema.hooks.post.map(
                (hook) => `${schema.name}Schema.post('${hook}', function(doc) {\n  // Add post-hook logic here\n});`,
            ),
        ].join("\n\n")

        const modelDefinition = `const ${schema.name}: Model<${schema.name}SchemaDto> = model("${schema.name}", ${schema.name}Schema);`

        const exportStatement = `export { ${schema.name} };`

        return [
            imports.join("\n"),
            "",
            schemaDefinition,
            "",
            indexDefinitions,
            indexDefinitions ? "" : "",
            virtualDefinitions,
            virtualDefinitions ? "" : "",
            methodDefinitions,
            methodDefinitions ? "" : "",
            staticDefinitions,
            staticDefinitions ? "" : "",
            hookDefinitions,
            hookDefinitions ? "" : "",
            modelDefinition,
            "",
            exportStatement,
        ]
            .filter((line) => line !== null)
            .join("\n")
    }


    const handleGenerate = () => {
        setGeneratedDTO(generateDTO())
        setGeneratedSchema(generateMongooseSchema())
        setActiveTab("preview")
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto p-6 max-w-7xl">
                <Header />

                <div>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="builder" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Schema Builder
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Code Preview
                            </TabsTrigger>
                        </TabsList>


                        <TabsContent value="builder" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Configuration Panel */}
                                <div className="lg:col-span-1 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Database className="h-5 w-5" />
                                                Schema Configuration
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <Label>Schema Name</Label>
                                                <Input
                                                    placeholder="e.g., User, Order, Product"
                                                    value={schema.name}
                                                    onChange={(e) => setSchema((prev) => ({ ...prev, name: e.target.value }))}
                                                />
                                            </div>

                                            <div>
                                                <Label>Custom Imports</Label>
                                                <Textarea
                                                    placeholder="e.g., import { AddressType } from './user.dto';"
                                                    value={schema.imports.join("\n")}
                                                    onChange={(e) =>
                                                        setSchema((prev) => ({
                                                            ...prev,
                                                            imports: e.target.value.split("\n").filter((line) => line.trim()),
                                                        }))
                                                    }
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <Label>Advanced Options</Label>
                                                <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                                            </div>

                                            {showAdvanced && (
                                                <div className="space-y-4 p-4 border rounded-lg">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="timestamps"
                                                                checked={schema.options.timestamps}
                                                                onCheckedChange={(checked) =>
                                                                    setSchema((prev) => ({
                                                                        ...prev,
                                                                        options: { ...prev.options, timestamps: !!checked },
                                                                    }))
                                                                }
                                                            />
                                                            <Label htmlFor="timestamps">Timestamps</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="versionKey"
                                                                checked={schema.options.versionKey}
                                                                onCheckedChange={(checked) =>
                                                                    setSchema((prev) => ({
                                                                        ...prev,
                                                                        options: { ...prev.options, versionKey: !!checked },
                                                                    }))
                                                                }
                                                            />
                                                            <Label htmlFor="versionKey">Version Key</Label>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label>Collection Name</Label>
                                                        <Input
                                                            placeholder="Custom collection name"
                                                            value={schema.options.collection || ""}
                                                            onChange={(e) =>
                                                                setSchema((prev) => ({
                                                                    ...prev,
                                                                    options: { ...prev.options, collection: e.target.value },
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Code className="h-5 w-5" />
                                                Actions
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button onClick={() => addField()} className="w-full">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Field
                                            </Button>
                                            <Button onClick={handleGenerate} className="w-full" variant="default">
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Generate Code
                                            </Button>
                                            <Separator />
                                            <div className="text-sm text-muted-foreground">
                                                <p className="font-medium mb-2">Field Statistics:</p>
                                                <div className="space-y-1">
                                                    <p>Total Fields: {schema.fields.length}</p>
                                                    <p>Required Fields: {schema.fields.filter((f) => f.required).length}</p>
                                                    <p>Unique Fields: {schema.fields.filter((f) => f.unique).length}</p>
                                                    <p>Enum Fields: {schema.fields.filter((f) => f.type === "enum").length}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Fields Panel */}
                                <div className="lg:col-span-2">
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Layers className="h-5 w-5" />
                                                    Schema Fields ({schema.fields.length})
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSchema((prev) => ({
                                                                ...prev,
                                                                fields: prev.fields.map((f) => ({ ...f, isExpanded: true })),
                                                            }))
                                                        }
                                                    >
                                                        Expand All
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSchema((prev) => ({
                                                                ...prev,
                                                                fields: prev.fields.map((f) => ({ ...f, isExpanded: false })),
                                                            }))
                                                        }
                                                    >
                                                        Collapse All
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-[600px] pr-4">
                                                <div className="space-y-4">
                                                    {schema.fields.map((field) => renderField(field))}
                                                    {schema.fields.length === 0 && (
                                                        <div className="text-center py-12">
                                                            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                                            <p className="text-lg font-medium text-muted-foreground mb-2">No fields added yet</p>
                                                            <p className="text-sm text-muted-foreground mb-4">
                                                                Start building your schema by adding fields
                                                            </p>
                                                            <Button onClick={() => addField()}>
                                                                <Plus className="h-4 w-4 mr-2" />
                                                                Add Your First Field
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                {schema.name.toLowerCase()}.dto.ts
                                            </CardTitle>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(generatedDTO)}
                                                    disabled={!generatedDTO}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => downloadFile(generatedDTO, `${schema.name.toLowerCase()}.dto.ts`)}
                                                    disabled={!generatedDTO}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[600px]">
                                            <pre className="bg-muted p-4 rounded-lg text-sm">
                                                <code>{generatedDTO || "Click 'Generate Code' to see the TypeScript DTO"}</code>
                                            </pre>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>


                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <Database className="h-5 w-5" />
                                                {schema.name.toLowerCase()}.model.ts
                                            </CardTitle>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(generatedSchema)}
                                                    disabled={!generatedSchema}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => downloadFile(generatedSchema, `${schema.name.toLowerCase()}.model.ts`)}
                                                    disabled={!generatedSchema}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[600px]">
                                            <pre className="bg-muted p-4 rounded-lg text-sm">
                                                <code>{generatedSchema || "Click 'Generate Code' to see the Mongoose schema"}</code>
                                            </pre>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
