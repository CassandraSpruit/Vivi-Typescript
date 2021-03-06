import { Component, ComponentConstructor, Service, ServiceConstructor } from '../models';
import { loadViviServices } from '../services/load-services.static';
import { NodeTreeService } from '../services/node-tree.service';
import { ComponentFactory } from './component-factory.class';
import { ServiceFactory } from './service-factory.class';

export interface ViviFactoryConstructor {
    serviceConstructors?: Array<ServiceConstructor>,
    componentConstructors: Array<ComponentConstructor>,
    rootComponent: new (...args) => Component
}

export class ModuleFactory {
    services: Map<string, ServiceFactory> = new Map<string, ServiceFactory>();
    components: Map<string, ComponentFactory> = new Map<string, ComponentFactory>();

    constructor(
        module: ViviFactoryConstructor
    ) {
        // @todo Replace instances of window.vivi with an injected version
        window.vivi = this;

        // Append Vivi services - these should be before any custom services
        if (!module.serviceConstructors) {
            module.serviceConstructors = loadViviServices;
        } else {
            module.serviceConstructors.unshift(...loadViviServices);
        }

        // Init Services
        // @todo: Automatically load services in the services folder\
        module.serviceConstructors.forEach(serviceConstructor => {
            let prereqArr = [];
            if (serviceConstructor.prereqArr) {
                prereqArr = serviceConstructor.prereqArr.map(prereq => {
                    // @todo: Services - Throw a specific warning to the user telling them about a missing service
                    return this.services.get(prereq.name);
                });
            }
            this.services.set(serviceConstructor.constructor.name, new ServiceFactory(serviceConstructor.constructor, prereqArr));
        });

        // NodeTree is needed to inject into Factory
        const nodeTree = this.get(NodeTreeService);

        // Init Components
        // @todo: Automatically load components in the components folder
        module.componentConstructors.forEach(constructor => {
            let serviceArr = [];
            if (constructor.services) {
                serviceArr = constructor.services.map(service => {
                    // @todo: Components - Throw a specific warning to the user telling them about a missing service
                    return this.services.get(service.name);
                });
            }
            this.components.set(constructor.constructor.name, new ComponentFactory(constructor.constructor, serviceArr, nodeTree));
        });

        // Mount root component
        const rootFactory = this.getFactory<Component>(module.rootComponent);
        // @todo Add ability to make root component append to a user-specified node
        rootFactory.createRoot(nodeTree);

        // Initialize
        this.start();
    }

    get<T extends Component>(constuctor: new (...args) => T, id?: string): T;
    get<T extends Service>(constuctor: new (...args) => T, id?: string): T;
    get(constuctor: new (...args) => Component | Service, id?: string): Component | Service {
        return this.getFactory(constuctor).get();
    }

    getFactory<T extends Component = Component>(constructor: new (...args) => T): ComponentFactory<T>;
    getFactory<T extends Service = Service>(constructor: new (...args) => T): ServiceFactory<T>;
    getFactory(constructor: new (...args) => (Component | Service)): ComponentFactory | ServiceFactory {
        const name = constructor.name;
        return this.getFactoryByString(name);
    }

    getFactoryByString(name: string): ComponentFactory | ServiceFactory {
        const matches = name.match(/(.*)(Component|Service)$/);
        if (matches && matches[2] && matches[2] === 'Service') {
            return this.services.get(name);
        }
        if (matches && matches[2] && matches[2] === 'Component') {
            return this.components.get(name);
        }
        console.error('No service factory or component factory found for ' + name);
        console.trace();
    }

    getComponentRegistry(): Array<string> {
        return Array.from(this.components.keys());
    }

    start() {
        // Placeholder
    }
}