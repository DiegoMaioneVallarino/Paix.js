import type { ComponentType } from "react";

export type PaixRuntimeProps = Record<string, unknown>;

export type PaixRuntimeComponent =
  ComponentType<PaixRuntimeProps>;

export class ComponentRegistry {
  private readonly components = new Map<
    string,
    PaixRuntimeComponent
  >();

  private readonly inputNames = new Map<string, readonly string[]>();

  public getAcceptedInputs(name: string): readonly string[] { return this.inputNames.get(name) ?? []; }

  public register(
    name: string,
    component: PaixRuntimeComponent,
    acceptedInputs: readonly string[] = [],
  ): void {
    this.components.set(name, component);
    this.inputNames.set(name, [...acceptedInputs]);
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