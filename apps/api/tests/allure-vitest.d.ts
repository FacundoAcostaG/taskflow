declare module 'allure-vitest' {
  import type { TaskContext } from 'vitest'

  export function label(
    context: TaskContext,
    name: string,
    value: string
  ): Promise<void>
  export function link(
    context: TaskContext,
    type: string,
    url: string,
    name?: string
  ): Promise<void>
  export function description(
    context: TaskContext,
    markdown: string
  ): Promise<void>
  export function feature(context: TaskContext, value: string): Promise<void>
  export function story(context: TaskContext, value: string): Promise<void>
  export function severity(context: TaskContext, value: string): Promise<void>
  export function step(
    context: TaskContext,
    name: string,
    body: () => Promise<void>
  ): Promise<void>
}
