import { logger } from "@lib/utils/logger";

type ModuleFactory<T> = () => T;

export class LazyRegistry {
    private static instance: LazyRegistry;
    private modules = new Map<string, any>();
    private factories = new Map<string, ModuleFactory<any>>();
    private initializing = new Set<string>();

    private constructor() {}

    static getInstance() {
        if (!LazyRegistry.instance) {
            LazyRegistry.instance = new LazyRegistry();
        }
        return LazyRegistry.instance;
    }

    /**
     * Register a module factory. The module will be created only when first requested.
     */
    register<T>(id: string, factory: ModuleFactory<T>) {
        if (this.factories.has(id)) {
            logger.warn(`LazyRegistry: Module ${id} is already registered. Overwriting.`);
        }
        this.factories.set(id, factory);
    }

    /**
     * Get a module by ID. Initializes it if necessary.
     * Handles circular dependencies by throwing a descriptive error.
     */
    get<T>(id: string): T {
        if (this.modules.has(id)) {
            return this.modules.get(id);
        }

        const factory = this.factories.get(id);
        if (!factory) {
            throw new Error(`LazyRegistry: Module ${id} is not registered.`);
        }

        if (this.initializing.has(id)) {
            throw new Error(`LazyRegistry: Circular dependency detected while initializing ${id}`);
        }

        this.initializing.add(id);
        try {
            const module = factory();
            this.modules.set(id, module);
            return module;
        } finally {
            this.initializing.delete(id);
        }
    }

    /**
     * Create a proxy that transparently accesses the lazy module.
     */
    createProxy<T extends object>(id: string): T {
        return new Proxy({} as T, {
            get: (_, prop) => {
                const module = this.get<any>(id);
                const value = module[prop];
                return typeof value === "function" ? value.bind(module) : value;
            },
            set: (_, prop, value) => {
                this.get<any>(id)[prop] = value;
                return true;
            }
        });
    }
}

export const lazyRegistry = LazyRegistry.getInstance();
