(function () {
    'use strict';

    const STORAGE_KEY = 'edubox_private_folder_v1';
    const MAX_ITEMS = 50;
    const MAX_TEXT_LENGTH = 12000;

    const safeParse = (value, fallback) => {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    };

    const normalizeItem = (item) => ({
        id: String(item.id || ''),
        title: String(item.title || 'Materiał EduBox').slice(0, 120),
        text: String(item.text || '').slice(0, MAX_TEXT_LENGTH),
        url: String(item.url || '').slice(0, 500),
        source: String(item.source || '').slice(0, 120),
        createdAt: String(item.createdAt || new Date().toISOString())
    });

    const list = () => {
        const parsed = safeParse(localStorage.getItem(STORAGE_KEY) || '[]', []);
        return Array.isArray(parsed) ? parsed.map(normalizeItem).filter(item => item.id) : [];
    };

    const write = (items) => {
        const storedItems = items.slice(0, MAX_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedItems));
        window.dispatchEvent(new CustomEvent('edubox-folder-change', { detail: { count: storedItems.length } }));
    };

    const add = (input) => {
        const id = window.crypto && typeof window.crypto.randomUUID === 'function'
            ? window.crypto.randomUUID()
            : `material-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const item = normalizeItem({ ...input, id, createdAt: new Date().toISOString() });
        const items = [item, ...list().filter(existing => existing.id !== item.id)];
        write(items);
        return item;
    };

    const remove = (id) => {
        const items = list().filter(item => item.id !== id);
        write(items);
        return items;
    };

    const clear = () => write([]);

    const toExport = () => ({
        format: 'edubox-private-folder',
        version: 1,
        exportedAt: new Date().toISOString(),
        items: list()
    });

    window.EduBoxFolder = {
        STORAGE_KEY,
        MAX_ITEMS,
        MAX_TEXT_LENGTH,
        list,
        add,
        remove,
        clear,
        toExport
    };
})();
