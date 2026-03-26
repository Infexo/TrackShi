import { registerPlugin, WebPlugin } from '@capacitor/core';

export interface FloatingWidgetPlugin {
  startWidget(options: { timerText: string; subjectName: string }): Promise<void>;
  stopWidget(): Promise<void>;
}

export class FloatingWidgetWeb extends WebPlugin implements FloatingWidgetPlugin {
  async startWidget(options: { timerText: string; subjectName: string }): Promise<void> {
    console.log('FloatingWidget.startWidget called on web with options:', options);
  }
  async stopWidget(): Promise<void> {
    console.log('FloatingWidget.stopWidget called on web');
  }
}

const FloatingWidget = registerPlugin<FloatingWidgetPlugin>('FloatingWidget', {
  web: () => new FloatingWidgetWeb(),
});

export default FloatingWidget;
