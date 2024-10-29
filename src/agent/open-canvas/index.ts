import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { OpenCanvasGraphAnnotation } from "./state";
import { generatePath } from "./nodes/generatePath";
import { generateFollowup } from "./nodes/generateFollowup";
import { generateArtifact } from "./nodes/generateArtifact";
import { rewriteArtifact } from "./nodes/rewriteArtifact";
import { rewriteArtifactTheme } from "./nodes/rewriteArtifactTheme";
import { updateArtifact } from "./nodes/updateArtifact";
import { respondToQuery } from "./nodes/respondToQuery";
import { rewriteCodeArtifactTheme } from "./nodes/rewriteCodeArtifactTheme";
import { reflectNode } from "./nodes/reflect";
import { customAction } from "./nodes/customAction";
import { updateHighlightedText } from "./nodes/updateHighlightedText";
import { DEFAULT_INPUTS } from "../../constants";
import { Slider } from "../../components/ui/slider";

const routeNode = (state: typeof OpenCanvasGraphAnnotation.State) => {
  if (!state.next) {
    throw new Error("'next' state field not set.");
  }

  return new Send(state.next, {
    ...state,
  });
};

const cleanState = (_: typeof OpenCanvasGraphAnnotation.State) => {
  return {
    ...DEFAULT_INPUTS,
  };
};

const builder = new StateGraph(OpenCanvasGraphAnnotation)
  // Start node & edge
  .addNode("generatePath", generatePath)
  .addEdge(START, "generatePath")
  // Nodes
  .addNode("respondToQuery", respondToQuery)
  .addNode("rewriteArtifact", rewriteArtifact)
  .addNode("rewriteArtifactTheme", rewriteArtifactTheme)
  .addNode("rewriteCodeArtifactTheme", rewriteCodeArtifactTheme)
  .addNode("updateArtifact", updateArtifact)
  .addNode("updateHighlightedText", updateHighlightedText)
  .addNode("generateArtifact", generateArtifact)
  .addNode("customAction", customAction)
  .addNode("generateFollowup", generateFollowup)
  .addNode("cleanState", cleanState)
  .addNode("reflect", reflectNode)
  // Initial router
  .addConditionalEdges("generatePath", routeNode, [
    "updateArtifact",
    "rewriteArtifactTheme",
    "rewriteCodeArtifactTheme",
    "respondToQuery",
    "generateArtifact",
    "rewriteArtifact",
    "customAction",
    "updateHighlightedText",
  ])
  // Edges
  .addEdge("generateArtifact", "generateFollowup")
  .addEdge("updateArtifact", "generateFollowup")
  .addEdge("updateHighlightedText", "generateFollowup")
  .addEdge("rewriteArtifact", "generateFollowup")
  .addEdge("rewriteArtifactTheme", "generateFollowup")
  .addEdge("rewriteCodeArtifactTheme", "generateFollowup")
  .addEdge("customAction", "generateFollowup")
  // End edges
  .addEdge("respondToQuery", "cleanState")
  // Only reflect if an artifact was generated/updated.
  .addEdge("generateFollowup", "reflect")
  .addEdge("reflect", "cleanState")
  .addEdge("cleanState", END);

export const graph = builder.compile().withConfig({ runName: "open_canvas" });

const Settings = () => {
  return (
    <div>
      <div>
        <label htmlFor="temperature-slider">Temperature</label>
        <Slider
          id="temperature-slider"
          min={0}
          max={2}
          step={0.1}
          defaultValue={1}
          aria-label="Temperature"
        />
        <p>
          Temperature controls the randomness of the model's output. Lower
          values make the output more deterministic, while higher values make it
          more random.
        </p>
      </div>
      <div>
        <label htmlFor="max-tokens-slider">Max Tokens</label>
        <Slider
          id="max-tokens-slider"
          min={1}
          max={4096}
          step={1}
          defaultValue={1024}
          aria-label="Max Tokens"
        />
        <p>
          Max Tokens determines the maximum number of tokens the model can
          generate in a single response. Adjust this based on the model's token
          output range.
        </p>
      </div>
    </div>
  );
};

export default Settings;
