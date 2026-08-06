import { Category } from '#models';

/**
 * Wirft 400, wenn `tags` Keys enthaelt, die nicht in der Category-Collection
 * stehen. ponytail: kein Cache — Schreibvorgaenge sind selten, ein `distinct`
 * pro Write ist billiger als eine Invalidierungs-Strategie.
 */
const assertCategories = async (tags: string[]) => {
    const known = new Set(await Category.distinct('key'));
    const unknown = tags.filter((t) => !known.has(t));

    if (unknown.length > 0) {
        const error = new Error(
            `Unbekannte Kategorie(n): ${unknown.join(', ')}`,
        );
        Object.assign(error, { status: 400 });
        throw error;
    }
};

export default assertCategories;
