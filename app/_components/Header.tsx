import Image from "next/image";

export default function Header() {
    return (
        <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-primary">
                Advanced DTO & Schema Generator
            </h1>
            <p className="text-lg text-muted-foreground">
                Create complex TypeScript DTOs and Mongoose schemas with advanced features, nested structures, and
                comprehensive validation.
            </p>
        </div>
    );
}
