import { componentRegistry } from "../runtime/ComponentRegistry";
import { Button } from "./components/Button";
import { Container } from "./components/Container";
import { Text } from "./components/Text";

let standardLibraryRegistered = false;

export function registerStandardLibrary(): void {
  if (standardLibraryRegistered) {
    return;
  }

  componentRegistry.register("Text", Text, ["value", "className"]);
  componentRegistry.register("Button", Button, ["label", "disabled", "onClick", "className"]);
  componentRegistry.register("Container", Container, ["children", "className"]);

  standardLibraryRegistered = true;
}