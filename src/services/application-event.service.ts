import { BehaviorSubject, OperatorFunction } from 'rxjs';
import { skip } from 'rxjs/operators';

import { ApplicationListener, ApplicationEvent } from '../events';
import { Service } from '../models/service.class';

export interface ListenerOptions {
    getCurrentValue?: boolean; // If event has already been triggered, get data from last event
    pipe?: OperatorFunction<ApplicationEvent, ApplicationEvent>; // Accepts rxjs operator functions to customize observable
}

export class ApplicationEventService extends Service {
    eventRegistry: Map<string, BehaviorSubject<ApplicationEvent>> = new Map<string, BehaviorSubject<ApplicationEvent>>();

    sendEvent(eventName: string, data?: any, closeAfterEvent?: boolean): void {
        const evt = <ApplicationEvent>{ data, closeOnComplete: closeAfterEvent };

        // Get event in registry
        const reg = this.eventRegistry.get(eventName);

        // Set event in registry if doesn't exist
        if (!reg) {
            this.eventRegistry.set(eventName, new BehaviorSubject(evt));
        } else {
            // Send next event in subscribers
            reg.next(evt);
        }
    }

    createListener(eventName: string, callback: (event: ApplicationEvent | any) => any, options?: ListenerOptions): ApplicationListener {
        // Try to get event in registry
        const reg = this.eventRegistry.get(eventName);
        let sub = reg || new BehaviorSubject(<ApplicationEvent>{ data: null });
        if (!reg) {
            this.eventRegistry.set(eventName, sub);
        }

        let obs = sub.asObservable();

        // Behavior subjects return current value by default, so work around that unless otherwise stated
        if (!(options && options.getCurrentValue)) {
            obs = obs.pipe(skip(1));
        }

        // Include other pipes if provided
        if (options && options.pipe) {
            obs = obs.pipe<ApplicationEvent>(options.pipe);
        }

        // Create listener
        return new ApplicationListener(eventName, callback, obs);
    }
}