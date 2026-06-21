/**
 * OMP RPC Protocol Types
 *
 * Based on OMP's documented RPC mode (https://omp.sh/docs/rpc).
 * JSONL over stdin/stdout — one JSON object per line.
 */

// ─── Inbound Commands (stdin → OMP) ─────────────────────────────────────────

export interface OmpRpcPromptCommand {
  type: "prompt";
  id?: string;
  message: string;
  images?: OmpImageContent[];
  streamingBehavior?: "steer" | "followUp";
}

export interface OmpRpcSteerCommand {
  type: "steer";
  id?: string;
  message: string;
  images?: OmpImageContent[];
}

export interface OmpRpcFollowUpCommand {
  type: "follow_up";
  id?: string;
  message: string;
  images?: OmpImageContent[];
}

export interface OmpRpcAbortCommand {
  type: "abort";
  id?: string;
}

export interface OmpRpcAbortAndPromptCommand {
  type: "abort_and_prompt";
  id?: string;
  message: string;
  images?: OmpImageContent[];
}

export interface OmpRpcGetStateCommand {
  type: "get_state";
  id?: string;
}

export interface OmpRpcSetModelCommand {
  type: "set_model";
  id?: string;
  provider: string;
  modelId: string;
}

export interface OmpRpcSetTodosCommand {
  type: "set_todos";
  id?: string;
  phases: OmpTodoPhase[];
}

export interface OmpRpcSetHostToolsCommand {
  type: "set_host_tools";
  id?: string;
  tools: OmpHostToolDefinition[];
}

export interface OmpRpcCompactCommand {
  type: "compact";
  id?: string;
  customInstructions?: string;
}

export interface OmpRpcNewSessionCommand {
  type: "new_session";
  id?: string;
  parentSession?: string;
}

export interface OmpRpcSwitchSessionCommand {
  type: "switch_session";
  id?: string;
  sessionPath: string;
}

export interface OmpRpcGetMessagesCommand {
  type: "get_messages";
  id?: string;
}

export interface OmpRpcSetSubagentSubscriptionCommand {
  type: "set_subagent_subscription";
  id?: string;
  level: "off" | "progress" | "events";
}

export interface OmpRpcGetSubagentsCommand {
  type: "get_subagents";
  id?: string;
}

export interface OmpRpcBashCommand {
  type: "bash";
  id?: string;
  command: string;
}

export interface OmpRpcSetThinkingLevelCommand {
  type: "set_thinking_level";
  id?: string;
  level: OmpThinkingLevel;
}

export type OmpRpcCommand =
  | OmpRpcPromptCommand
  | OmpRpcSteerCommand
  | OmpRpcFollowUpCommand
  | OmpRpcAbortCommand
  | OmpRpcAbortAndPromptCommand
  | OmpRpcGetStateCommand
  | OmpRpcSetModelCommand
  | OmpRpcSetTodosCommand
  | OmpRpcSetHostToolsCommand
  | OmpRpcCompactCommand
  | OmpRpcNewSessionCommand
  | OmpRpcSwitchSessionCommand
  | OmpRpcGetMessagesCommand
  | OmpRpcSetSubagentSubscriptionCommand
  | OmpRpcGetSubagentsCommand
  | OmpRpcBashCommand
  | OmpRpcSetThinkingLevelCommand;

// ─── Outbound Frames (OMP → stdout) ─────────────────────────────────────────

export interface OmpRpcReadyFrame {
  type: "ready";
}

export interface OmpRpcResponse {
  type: "response";
  id?: string;
  command: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface OmpRpcPromptResult {
  type: "prompt_result";
  id?: string;
  agentInvoked: boolean;
}

export interface OmpRpcCommandOutput {
  type: "command_output";
  id?: string;
  output: string;
}

export interface OmpRpcSubagentLifecycle {
  type: "subagent_lifecycle";
  subagentId: string;
  event: "spawned" | "completed" | "failed";
  data?: unknown;
}

export interface OmpRpcSubagentProgress {
  type: "subagent_progress";
  subagentId: string;
  progress: number;
  message?: string;
}

export type OmpRpcFrame =
  | OmpRpcReadyFrame
  | OmpRpcResponse
  | OmpRpcAgentEvent
  | OmpRpcPromptResult
  | OmpRpcCommandOutput
  | OmpRpcSubagentLifecycle
  | OmpRpcSubagentProgress;

// ─── Agent Events (streamed during prompt execution) ─────────────────────────

export interface OmpAgentTextDeltaEvent {
  type: "message_update";
  assistantMessageEvent: {
    type: "text_delta";
    delta: string;
  };
}

export interface OmpAgentToolStartEvent {
  type: "tool_execution_start";
  toolName: string;
  args?: Record<string, unknown>;
}

export interface OmpAgentToolEndEvent {
  type: "tool_execution_end";
  toolName: string;
  result?: unknown;
}

export interface OmpAgentStartEvent {
  type: "agent_start";
}

export interface OmpAgentEndEvent {
  type: "agent_end";
}

export interface OmpAgentTurnStartEvent {
  type: "turn_start";
}

export interface OmpAgentTurnEndEvent {
  type: "turn_end";
}

export type OmpRpcAgentEvent =
  | OmpAgentTextDeltaEvent
  | OmpAgentToolStartEvent
  | OmpAgentToolEndEvent
  | OmpAgentStartEvent
  | OmpAgentEndEvent
  | OmpAgentTurnStartEvent
  | OmpAgentTurnEndEvent;

// ─── Supporting Types ────────────────────────────────────────────────────────

export interface OmpImageContent {
  data: string; // base64
  mimeType: string;
}

export interface OmpTodoTask {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "failed";
}

export interface OmpTodoPhase {
  id: string;
  name: string;
  tasks: OmpTodoTask[];
}

export interface OmpHostToolParameter {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface OmpHostToolDefinition {
  name: string;
  label?: string;
  description: string;
  parameters: OmpHostToolParameter;
}

export type OmpThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

export interface OmpSessionState {
  model: { provider: string; id: string };
  thinkingLevel: OmpThinkingLevel;
  isStreaming: boolean;
  isCompacting: boolean;
  sessionFile: string;
  sessionId: string;
  sessionName: string;
  autoCompactionEnabled: boolean;
  messageCount: number;
  queuedMessageCount: number;
  todoPhases: OmpTodoPhase[];
  contextUsage: {
    tokens: number;
    contextWindow: number;
    percent: number;
  };
}
