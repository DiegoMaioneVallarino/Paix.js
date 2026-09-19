import type { ComponentType } from "react";

export type PaixRuntimeProps = Record<string, unknown>;

export type PaixRuntimeComponent =
  ComponentType<PaixRuntimeProps>;

export class ComponentRegistry {
  private readonly components = new Map<
    string,
    PaixRuntimeComponent
  >();

  public register(
    name: string,
    component: PaixRuntimeComponent,
  ): void {
    this.components.set(name, component);
  }

  public get(
    name: string,
  ): PaixRuntimeComponent | undefined {
    return this.components.get(name);
  }

  public has(name: string): boolean {
    return this.components.has(name);
  }

  public getNames(): string[] {
    return Array.from(this.components.keys());
  }
}

export const componentRegistry =
  new ComponentRegistry();