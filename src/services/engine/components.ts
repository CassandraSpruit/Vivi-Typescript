import { Component } from '../../models/component.class';
import { FactoryService } from '../factory.service';
import { ViviComponentFactory } from '../../factory';

export class ParseComponents {
    constructor(private factoryService: FactoryService) {
        //   
    }

    parseComponents(el: HTMLElement): Array<Component> {
        return this.createRecipe(el);
    }

    /*
        @todo Implement Component Redraw
    */
    // parseComponentRedraw(el: HTMLElement, oldChildren: Array<Component>): Array<Component> {
    //     // Find arr of parents
    //     return oldChildren;
    // }

    private createRecipe(node: HTMLElement): Array<Component> {
        const recipe = new Array<Component>();
        this.factoryService.module.getComponentRegistry().forEach(reg => {
            // Strip 'Component' off of name
            const name = reg.slice(0, reg.lastIndexOf('Component'));
            const els = node.querySelectorAll(name.toLowerCase());
            for (let i = 0; i < els.length; i++) {
                const el = els.item(i);
                const factory = this.factoryService.getFactoryByString(reg) as ViviComponentFactory<Component>;
                const child = factory.create((<HTMLElement>el).dataset);
                child.append(el.parentElement, true);
                recipe.push(child);
            }
        });

        return recipe;
    }
};