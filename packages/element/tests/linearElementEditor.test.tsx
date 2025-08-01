import { pointCenter, pointFrom } from "@excalidraw/math";
import { act, queryByTestId, queryByText } from "@testing-library/react";
import { vi } from "vitest";

import {
  ROUNDNESS,
  VERTICAL_ALIGN,
  KEYS,
  reseed,
  arrayToMap,
} from "@excalidraw/common";

import { Excalidraw } from "@excalidraw/excalidraw";
import * as InteractiveCanvas from "@excalidraw/excalidraw/renderer/interactiveScene";
import * as StaticScene from "@excalidraw/excalidraw/renderer/staticScene";
import { API } from "@excalidraw/excalidraw/tests/helpers/api";

import { Keyboard, Pointer, UI } from "@excalidraw/excalidraw/tests/helpers/ui";
import {
  screen,
  render,
  fireEvent,
  GlobalTestState,
  unmountComponent,
} from "@excalidraw/excalidraw/tests/test-utils";

import type { GlobalPoint, LocalPoint } from "@excalidraw/math";

import { wrapText } from "../src";
import * as textElementUtils from "../src/textElement";
import { getBoundTextElementPosition, getBoundTextMaxWidth } from "../src";
import { LinearElementEditor } from "../src";
import { newArrowElement } from "../src";

import {
  getTextEditor,
  TEXT_EDITOR_SELECTOR,
} from "../../excalidraw/tests/queries/dom";

import type {
  ExcalidrawElement,
  ExcalidrawLinearElement,
  ExcalidrawTextElementWithContainer,
  FontString,
} from "../src/types";

const renderInteractiveScene = vi.spyOn(
  InteractiveCanvas,
  "renderInteractiveScene",
);
const renderStaticScene = vi.spyOn(StaticScene, "renderStaticScene");

const { h } = window;
const font = "20px Cascadia, width: Segoe UI Emoji" as FontString;

describe("Test Linear Elements", () => {
  let container: HTMLElement;
  let interactiveCanvas: HTMLCanvasElement;

  beforeEach(async () => {
    unmountComponent();
    localStorage.clear();
    renderInteractiveScene.mockClear();
    renderStaticScene.mockClear();
    reseed(7);
    const comp = await render(<Excalidraw handleKeyboardGlobally={true} />);
    h.state.width = 1000;
    h.state.height = 1000;
    container = comp.container;
    interactiveCanvas = container.querySelector("canvas.interactive")!;
  });

  const p1 = pointFrom<GlobalPoint>(20, 20);
  const p2 = pointFrom<GlobalPoint>(60, 20);
  const midpoint = pointCenter<GlobalPoint>(p1, p2);
  const delta = 50;
  const mouse = new Pointer("mouse");

  const createTwoPointerLinearElement = (
    type: ExcalidrawLinearElement["type"],
    roundness: ExcalidrawElement["roundness"] = null,
    roughness: ExcalidrawLinearElement["roughness"] = 0,
  ) => {
    const line = API.createElement({
      x: p1[0],
      y: p1[1],
      width: p2[0] - p1[0],
      height: 0,
      type,
      roughness,
      points: [pointFrom(0, 0), pointFrom(p2[0] - p1[0], p2[1] - p1[1])],
      roundness,
    });
    API.setElements([line]);

    mouse.clickAt(p1[0], p1[1]);
    return line;
  };

  const createThreePointerLinearElement = (
    type: ExcalidrawLinearElement["type"],
    roundness: ExcalidrawElement["roundness"] = null,
    roughness: ExcalidrawLinearElement["roughness"] = 0,
  ) => {
    //dragging line from midpoint
    const p3 = [midpoint[0] + delta - p1[0], midpoint[1] + delta - p1[1]];
    const line = API.createElement({
      x: p1[0],
      y: p1[1],
      width: p3[0] - p1[0],
      height: 0,
      type,
      roughness,
      points: [
        pointFrom(0, 0),
        pointFrom(p3[0], p3[1]),
        pointFrom(p2[0] - p1[0], p2[1] - p1[1]),
      ],
      roundness,
    });
    h.app.scene.mutateElement(line, { points: line.points });
    API.setElements([line]);
    mouse.clickAt(p1[0], p1[1]);
    return line;
  };

  const enterLineEditingMode = (
    line: ExcalidrawLinearElement,
    selectProgrammatically = false,
  ) => {
    if (selectProgrammatically) {
      API.setSelectedElements([line]);
    } else {
      mouse.clickAt(p1[0], p1[1]);
    }
    Keyboard.withModifierKeys({ ctrl: true }, () => {
      Keyboard.keyPress(KEYS.ENTER);
    });
    expect(h.state.selectedLinearElement?.isEditing).toBe(true);
    expect(h.state.selectedLinearElement?.elementId).toEqual(line.id);
  };

  const drag = (startPoint: GlobalPoint, endPoint: GlobalPoint) => {
    fireEvent.pointerDown(interactiveCanvas, {
      clientX: startPoint[0],
      clientY: startPoint[1],
    });
    fireEvent.pointerMove(interactiveCanvas, {
      clientX: endPoint[0],
      clientY: endPoint[1],
    });
    fireEvent.pointerUp(interactiveCanvas, {
      clientX: endPoint[0],
      clientY: endPoint[1],
    });
  };

  const deletePoint = (point: GlobalPoint) => {
    fireEvent.pointerDown(interactiveCanvas, {
      clientX: point[0],
      clientY: point[1],
    });
    fireEvent.pointerUp(interactiveCanvas, {
      clientX: point[0],
      clientY: point[1],
    });
    Keyboard.keyPress(KEYS.DELETE);
  };

  it("should normalize the element points at creation", () => {
    const element = newArrowElement({
      type: "arrow",
      points: [pointFrom<LocalPoint>(0.5, 0), pointFrom<LocalPoint>(100, 100)],
      x: 0,
      y: 0,
    });
    expect(element.points).toEqual([
      pointFrom<LocalPoint>(0.5, 0),
      pointFrom<LocalPoint>(100, 100),
    ]);
    new LinearElementEditor(element, arrayToMap(h.elements));
    expect(element.points).toEqual([
      pointFrom<LocalPoint>(0, 0),
      pointFrom<LocalPoint>(99.5, 100),
    ]);
  });

  it("should not drag line and add midpoint until dragged beyond a threshold", () => {
    createTwoPointerLinearElement("line");
    const line = h.elements[0] as ExcalidrawLinearElement;
    const originalX = line.x;
    const originalY = line.y;
    expect(line.points.length).toEqual(2);

    mouse.clickAt(midpoint[0], midpoint[1]);
    drag(midpoint, pointFrom(midpoint[0] + 1, midpoint[1] + 1));

    expect(line.points.length).toEqual(2);

    expect(line.x).toBe(originalX);
    expect(line.y).toBe(originalY);
    expect(line.points.length).toEqual(2);

    drag(midpoint, pointFrom(midpoint[0] + delta, midpoint[1] + delta));
    expect(line.x).toBe(originalX);
    expect(line.y).toBe(originalY);
    expect(line.points.length).toEqual(3);
  });

  it("should allow dragging line from midpoint in 2 pointer lines outside editor", async () => {
    createTwoPointerLinearElement("line");
    const line = h.elements[0] as ExcalidrawLinearElement;

    expect(renderInteractiveScene.mock.calls.length).toMatchInlineSnapshot(`5`);
    expect(renderStaticScene.mock.calls.length).toMatchInlineSnapshot(`5`);
    expect((h.elements[0] as ExcalidrawLinearElement).points.length).toEqual(2);

    // drag line from midpoint
    drag(midpoint, pointFrom(midpoint[0] + delta, midpoint[1] + delta));
    expect(renderInteractiveScene.mock.calls.length).toMatchInlineSnapshot(`9`);
    expect(renderStaticScene.mock.calls.length).toMatchInlineSnapshot(`7`);
    expect(line.points.length).toEqual(3);
    expect(line.points).toMatchInlineSnapshot(`
      [
        [
          0,
          0,
        ],
        [
          70,
          50,
        ],
        [
          40,
          0,
        ],
      ]
    `);
  });

  it("should allow entering and exiting line editor via context menu", () => {
    createTwoPointerLinearElement("line");
    fireEvent.contextMenu(GlobalTestState.interactiveCanvas, {
      button: 2,
      clientX: midpoint[0],
      clientY: midpoint[1],
    });
    // Enter line editor
    const contextMenu = document.querySelector(".context-menu");
    fireEvent.contextMenu(GlobalTestState.interactiveCanvas, {
      button: 2,
      clientX: midpoint[0],
      clientY: midpoint[1],
    });
    fireEvent.click(queryByText(contextMenu as HTMLElement, "Edit line")!);

    expect(h.state.selectedLinearElement?.isEditing).toBe(true);
    expect(h.state.selectedLinearElement?.elementId).toEqual(h.elements[0].id);
  });

  it("should enter line editor via enter (line)", () => {
    createTwoPointerLinearElement("line");
    expect(h.state.selectedLinearElement?.isEditing).toBe(false);

    mouse.clickAt(midpoint[0], midpoint[1]);
    Keyboard.keyPress(KEYS.ENTER);
    expect(h.state.selectedLinearElement?.isEditing).toBe(true);
    expect(h.state.selectedLinearElement?.elementId).toEqual(h.elements[0].id);
  });

  // ctrl+enter alias (to align with arrows)
  it("should enter line editor via ctrl+enter (line)", () => {
    createTwoPointerLinearElement("line");
    expect(h.state.selectedLinearElement?.isEditing).toBe(false);

    mouse.clickAt(midpoint[0], midpoint[1]);
    Keyboard.withModifierKeys({ ctrl: true }, () => {
      Keyboard.keyPress(KEYS.ENTER);
    });
    expect(h.state.selectedLinearElement?.isEditing).toBe(true);
    expect(h.state.selectedLinearElement?.elementId).toEqual(h.elements[0].id);
  });

  it("should enter line editor via ctrl+enter (arrow)", () => {
    createTwoPointerLinearElement("arrow");
    expect(h.state.selectedLinearElement?.isEditing).toBe(false);

    mouse.clickAt(midpoint[0], midpoint[1]);
    Keyboard.withModifierKeys({ ctrl: true }, () => {
      Keyboard.keyPress(KEYS.ENTER);
    });
    expect(h.state.selectedLinearElement?.isEditing).toBe(true);
    expect(h.state.selectedLinearElement?.elementId).toEqual(h.elements[0].id);
  });

  it("should enter line editor on ctrl+dblclick (simple arrow)", () => {
    createTwoPointerLinearElement("arrow");
    expect(h.state.selectedLinearElement?.isEditing).toBe(false);

    Keyboard.withModifierKeys({ ctrl: true }, () => {
      mouse.doubleClick();
    });
    expect(h.state.selectedLinearElement?.isEditing).toBe(true);
    expect(h.state.selectedLinearElement?.elementId).toEqual(h.elements[0].id);
  });

  it("should enter line editor on ctrl+dblclick (line)", () => {
    createTwoPointerLinearElement("line");
    expect(h.state.selectedLinearElement?.isEditing).toBe(false);

    Keyboard.withModifierKeys({ ctrl: true }, () => {
      mouse.doubleClick();
    });
    expect(h.state.selectedLinearElement?.isEditing).toBe(true);
    expect(h.state.selectedLinearElement?.elementId).toEqual(h.elements[0].id);
  });

  it("should enter line editor on dblclick (line)", () => {
    createTwoPointerLinearElement("line");
    expect(h.state.selectedLinearElement?.isEditing).toBe(false);

    mouse.doubleClick();
    expect(h.state.selectedLinearElement?.isEditing).toBe(true);
    expect(h.state.selectedLinearElement?.elementId).toEqual(h.elements[0].id);
  });

  it("should not enter line editor on dblclick (arrow)", async () => {
    createTwoPointerLinearElement("arrow");
    expect(h.state.selectedLinearElement?.isEditing).toBe(false);

    mouse.doubleClick();
    expect(h.state.selectedLinearElement).toBe(null);
    await getTextEditor();
  });

  it("shouldn't create text element on double click in line editor (arrow)", async () => {
    createTwoPointerLinearElement("arrow");
    const arrow = h.elements[0] as ExcalidrawLinearElement;
    enterLineEditingMode(arrow);

    expect(h.state.selectedLinearElement?.isEditing).toBe(true);
    expect(h.state.selectedLinearElement?.elementId).toEqual(arrow.id);

    mouse.doubleClick();
    expect(h.state.selectedLinearElement?.isEditing).toBe(true);
    expect(h.state.selectedLinearElement?.elementId).toEqual(arrow.id);
    expect(h.elements.length).toEqual(1);

    expect(document.querySelector(TEXT_EDITOR_SELECTOR)).toBe(null);
  });

  describe("Inside editor", () => {
    it("should not drag line and add midpoint when dragged irrespective of threshold", () => {
      createTwoPointerLinearElement("line");
      const line = h.elements[0] as ExcalidrawLinearElement;
      const originalX = line.x;
      const originalY = line.y;
      enterLineEditingMode(line);

      expect(line.points.length).toEqual(2);

      mouse.clickAt(midpoint[0], midpoint[1]);
      expect(line.points.length).toEqual(2);

      drag(midpoint, pointFrom(midpoint[0] + 1, midpoint[1] + 1));
      expect(line.x).toBe(originalX);
      expect(line.y).toBe(originalY);
      expect(line.points.length).toEqual(3);
    });

    it("should allow dragging line from midpoint in 2 pointer lines", async () => {
      createTwoPointerLinearElement("line");

      const line = h.elements[0] as ExcalidrawLinearElement;
      enterLineEditingMode(line);

      // drag line from midpoint
      drag(midpoint, pointFrom(midpoint[0] + delta, midpoint[1] + delta));
      expect(renderInteractiveScene.mock.calls.length).toMatchInlineSnapshot(
        `11`,
      );
      expect(renderStaticScene.mock.calls.length).toMatchInlineSnapshot(`6`);

      expect(line.points.length).toEqual(3);
      expect(line.points).toMatchInlineSnapshot(`
        [
          [
            0,
            0,
          ],
          [
            70,
            50,
          ],
          [
            40,
            0,
          ],
        ]
      `);
    });

    it("should update the midpoints when element roundness changed", async () => {
      createThreePointerLinearElement("line");

      const line = h.elements[0] as ExcalidrawLinearElement;
      expect(line.points.length).toEqual(3);

      enterLineEditingMode(line);

      const midPointsWithSharpEdge = LinearElementEditor.getEditorMidPoints(
        line,
        h.app.scene.getNonDeletedElementsMap(),
        h.state,
      );

      // update roundness
      fireEvent.click(screen.getByTitle("Round"));

      expect(renderInteractiveScene.mock.calls.length).toMatchInlineSnapshot(
        `9`,
      );
      expect(renderStaticScene.mock.calls.length).toMatchInlineSnapshot(`6`);

      const midPointsWithRoundEdge = LinearElementEditor.getEditorMidPoints(
        h.elements[0] as ExcalidrawLinearElement,
        h.app.scene.getNonDeletedElementsMap(),
        h.state,
      );
      expect(midPointsWithRoundEdge[0]).not.toEqual(midPointsWithSharpEdge[0]);
      expect(midPointsWithRoundEdge[1]).not.toEqual(midPointsWithSharpEdge[1]);

      expect(midPointsWithRoundEdge).toMatchInlineSnapshot(`
        [
          [
            "54.27552",
            "46.16120",
          ],
          [
            "76.95494",
            "44.56052",
          ],
        ]
      `);
    });

    it("should update all the midpoints when element position changed", async () => {
      const elementsMap = arrayToMap(h.elements);

      createThreePointerLinearElement("line", {
        type: ROUNDNESS.PROPORTIONAL_RADIUS,
      });

      const line = h.elements[0] as ExcalidrawLinearElement;
      expect(line.points.length).toEqual(3);
      enterLineEditingMode(line);

      const points = LinearElementEditor.getPointsGlobalCoordinates(
        line,
        elementsMap,
      );
      expect([line.x, line.y]).toEqual(points[0]);

      const midPoints = LinearElementEditor.getEditorMidPoints(
        line,
        h.app.scene.getNonDeletedElementsMap(),
        h.state,
      );

      const startPoint = pointCenter(points[0], midPoints[0]!);
      const deltaX = 50;
      const deltaY = 20;
      const endPoint = pointFrom<GlobalPoint>(
        startPoint[0] + deltaX,
        startPoint[1] + deltaY,
      );

      // Move the element
      drag(startPoint, endPoint);

      expect(renderInteractiveScene.mock.calls.length).toMatchInlineSnapshot(
        `11`,
      );
      expect(renderStaticScene.mock.calls.length).toMatchInlineSnapshot(`7`);

      expect([line.x, line.y]).toEqual([
        points[0][0] + deltaX,
        points[0][1] + deltaY,
      ]);

      const newMidPoints = LinearElementEditor.getEditorMidPoints(
        line,
        h.app.scene.getNonDeletedElementsMap(),
        h.state,
      );
      expect(midPoints[0]).not.toEqual(newMidPoints[0]);
      expect(midPoints[1]).not.toEqual(newMidPoints[1]);
      expect(newMidPoints).toMatchInlineSnapshot(`
        [
          [
            "104.27552",
            "66.16120",
          ],
          [
            "126.95494",
            "64.56052",
          ],
        ]
      `);
    });

    describe("When edges are round", () => {
      // This is the expected midpoint for line with round edge
      // hence hardcoding it so if later some bug is introduced
      // this will fail and we can fix it
      const firstSegmentMidpoint = pointFrom<GlobalPoint>(55, 45);
      const lastSegmentMidpoint = pointFrom<GlobalPoint>(75, 40);

      let line: ExcalidrawLinearElement;

      beforeEach(() => {
        line = createThreePointerLinearElement("line");

        expect(line.points.length).toEqual(3);

        enterLineEditingMode(line);
      });

      it("should allow dragging lines from midpoints in between segments", async () => {
        // drag line via first segment midpoint
        drag(
          firstSegmentMidpoint,
          pointFrom(
            firstSegmentMidpoint[0] + delta,
            firstSegmentMidpoint[1] + delta,
          ),
        );
        expect(line.points.length).toEqual(4);

        // drag line from last segment midpoint
        drag(
          lastSegmentMidpoint,
          pointFrom(
            lastSegmentMidpoint[0] + delta,
            lastSegmentMidpoint[1] + delta,
          ),
        );

        expect(renderInteractiveScene.mock.calls.length).toMatchInlineSnapshot(
          `14`,
        );
        expect(renderStaticScene.mock.calls.length).toMatchInlineSnapshot(`7`);

        expect(line.points.length).toEqual(5);

        expect((h.elements[0] as ExcalidrawLinearElement).points)
          .toMatchInlineSnapshot(`
            [
              [
                0,
                0,
              ],
              [
                85,
                75,
              ],
              [
                70,
                50,
              ],
              [
                105,
                70,
              ],
              [
                40,
                0,
              ],
            ]
          `);
      });

      it("should update only the first segment midpoint when its point is dragged", async () => {
        const elementsMap = arrayToMap(h.elements);
        const points = LinearElementEditor.getPointsGlobalCoordinates(
          line,
          elementsMap,
        );
        const midPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );

        const hitCoords = pointFrom<GlobalPoint>(points[0][0], points[0][1]);

        // Drag from first point
        drag(hitCoords, pointFrom(hitCoords[0] - delta, hitCoords[1] - delta));

        expect(renderInteractiveScene.mock.calls.length).toMatchInlineSnapshot(
          `11`,
        );
        expect(renderStaticScene.mock.calls.length).toMatchInlineSnapshot(`6`);

        const newPoints = LinearElementEditor.getPointsGlobalCoordinates(
          line,
          elementsMap,
        );
        expect([newPoints[0][0], newPoints[0][1]]).toEqual([
          points[0][0] - delta,
          points[0][1] - delta,
        ]);

        const newMidPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );

        expect(midPoints[0]).not.toEqual(newMidPoints[0]);
        expect(midPoints[1]).toEqual(newMidPoints[1]);
      });

      it("should hide midpoints in the segment when points moved close", async () => {
        const elementsMap = arrayToMap(h.elements);
        const points = LinearElementEditor.getPointsGlobalCoordinates(
          line,
          elementsMap,
        );
        const midPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );

        const hitCoords = pointFrom<GlobalPoint>(points[0][0], points[0][1]);

        // Drag from first point
        drag(hitCoords, pointFrom(hitCoords[0] + delta, hitCoords[1] + delta));

        expect(renderInteractiveScene.mock.calls.length).toMatchInlineSnapshot(
          `11`,
        );
        expect(renderStaticScene.mock.calls.length).toMatchInlineSnapshot(`6`);

        const newPoints = LinearElementEditor.getPointsGlobalCoordinates(
          line,
          elementsMap,
        );
        expect([newPoints[0][0], newPoints[0][1]]).toEqual([
          points[0][0] + delta,
          points[0][1] + delta,
        ]);

        const newMidPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );
        // This midpoint is hidden since the points are too close
        expect(newMidPoints[0]).toBeNull();
        expect(midPoints[1]).toEqual(newMidPoints[1]);
      });

      it("should remove the midpoint when one of the points in the segment is deleted", async () => {
        const line = h.elements[0] as ExcalidrawLinearElement;
        enterLineEditingMode(line);
        const points = LinearElementEditor.getPointsGlobalCoordinates(
          line,
          arrayToMap(h.elements),
        );

        // dragging line from last segment midpoint
        drag(
          lastSegmentMidpoint,
          pointFrom(lastSegmentMidpoint[0] + 50, lastSegmentMidpoint[1] + 50),
        );
        expect(line.points.length).toEqual(4);

        const midPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );

        // delete 3rd point
        deletePoint(points[2]);
        expect(line.points.length).toEqual(3);
        expect(renderInteractiveScene.mock.calls.length).toMatchInlineSnapshot(
          `17`,
        );
        expect(renderStaticScene.mock.calls.length).toMatchInlineSnapshot(`7`);

        const newMidPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );
        expect(newMidPoints.length).toEqual(2);
        expect(midPoints[0]).toEqual(newMidPoints[0]);
        expect(midPoints[1]).toEqual(newMidPoints[1]);
      });
    });

    describe("When edges are round", () => {
      // This is the expected midpoint for line with round edge
      // hence hardcoding it so if later some bug is introduced
      // this will fail and we can fix it
      const firstSegmentMidpoint = pointFrom<GlobalPoint>(
        55.9697848965255,
        47.442326230998205,
      );
      const lastSegmentMidpoint = pointFrom<GlobalPoint>(
        76.08587175006699,
        43.294165939653226,
      );
      let line: ExcalidrawLinearElement;

      beforeEach(() => {
        line = createThreePointerLinearElement("line", {
          type: ROUNDNESS.PROPORTIONAL_RADIUS,
        });
        expect(line.points.length).toEqual(3);

        enterLineEditingMode(line);
      });

      it("should allow dragging lines from midpoints in between segments", async () => {
        // drag line from first segment midpoint
        drag(
          firstSegmentMidpoint,
          pointFrom(
            firstSegmentMidpoint[0] + delta,
            firstSegmentMidpoint[1] + delta,
          ),
        );
        expect(line.points.length).toEqual(4);

        // drag line from last segment midpoint
        drag(
          lastSegmentMidpoint,
          pointFrom(
            lastSegmentMidpoint[0] + delta,
            lastSegmentMidpoint[1] + delta,
          ),
        );
        expect(renderInteractiveScene.mock.calls.length).toMatchInlineSnapshot(
          `14`,
        );
        expect(renderStaticScene.mock.calls.length).toMatchInlineSnapshot(`7`);
        expect(line.points.length).toEqual(5);

        expect((h.elements[0] as ExcalidrawLinearElement).points)
          .toMatchInlineSnapshot(`
            [
              [
                0,
                0,
              ],
              [
                "85.96978",
                "77.44233",
              ],
              [
                70,
                50,
              ],
              [
                "106.08587",
                "73.29417",
              ],
              [
                40,
                0,
              ],
            ]
          `);
      });

      it("should update all the midpoints when its point is dragged", async () => {
        const elementsMap = arrayToMap(h.elements);
        const points = LinearElementEditor.getPointsGlobalCoordinates(
          line,
          elementsMap,
        );
        const midPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );

        const hitCoords = pointFrom<GlobalPoint>(points[0][0], points[0][1]);

        // Drag from first point
        drag(hitCoords, pointFrom(hitCoords[0] - delta, hitCoords[1] - delta));

        const newPoints = LinearElementEditor.getPointsGlobalCoordinates(
          line,
          elementsMap,
        );
        expect([newPoints[0][0], newPoints[0][1]]).toEqual([
          points[0][0] - delta,
          points[0][1] - delta,
        ]);

        const newMidPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );

        expect(midPoints[0]).not.toEqual(newMidPoints[0]);
        expect(midPoints[1]).not.toEqual(newMidPoints[1]);
        expect(newMidPoints).toMatchInlineSnapshot(`
          [
            [
              "29.28349",
              "20.91105",
            ],
            [
              "78.86048",
              "46.12277",
            ],
          ]
        `);
      });

      it("should hide midpoints in the segment when points moved close", async () => {
        const elementsMap = arrayToMap(h.elements);
        const points = LinearElementEditor.getPointsGlobalCoordinates(
          line,
          elementsMap,
        );
        const midPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );

        const hitCoords = pointFrom<GlobalPoint>(points[0][0], points[0][1]);

        // Drag from first point
        drag(hitCoords, pointFrom(hitCoords[0] + delta, hitCoords[1] + delta));

        expect(renderInteractiveScene.mock.calls.length).toMatchInlineSnapshot(
          `11`,
        );
        expect(renderStaticScene.mock.calls.length).toMatchInlineSnapshot(`6`);

        const newPoints = LinearElementEditor.getPointsGlobalCoordinates(
          line,
          elementsMap,
        );
        expect([newPoints[0][0], newPoints[0][1]]).toEqual([
          points[0][0] + delta,
          points[0][1] + delta,
        ]);

        const newMidPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );
        // This mid point is hidden due to point being too close
        expect(newMidPoints[0]).toBeNull();
        expect(newMidPoints[1]).not.toEqual(midPoints[1]);
      });

      it("should update all the midpoints when a point is deleted", async () => {
        const elementsMap = arrayToMap(h.elements);

        drag(
          lastSegmentMidpoint,
          pointFrom(
            lastSegmentMidpoint[0] + delta,
            lastSegmentMidpoint[1] + delta,
          ),
        );
        expect(line.points.length).toEqual(4);

        const midPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );
        const points = LinearElementEditor.getPointsGlobalCoordinates(
          line,
          elementsMap,
        );

        // delete 3rd point
        deletePoint(points[2]);
        expect(line.points.length).toEqual(3);

        const newMidPoints = LinearElementEditor.getEditorMidPoints(
          line,
          h.app.scene.getNonDeletedElementsMap(),
          h.state,
        );
        expect(newMidPoints.length).toEqual(2);
        expect(midPoints[0]).not.toEqual(newMidPoints[0]);
        expect(midPoints[1]).not.toEqual(newMidPoints[1]);
        expect(newMidPoints).toMatchInlineSnapshot(`
          [
            [
              "54.27552",
              "46.16120",
            ],
            [
              "76.95494",
              "44.56052",
            ],
          ]
        `);
      });
    });

    it("in-editor dragging a line point covered by another element", () => {
      createTwoPointerLinearElement("line");
      const line = h.elements[0] as ExcalidrawLinearElement;
      API.setElements([
        line,
        API.createElement({
          type: "rectangle",
          x: line.x - 50,
          y: line.y - 50,
          width: 100,
          height: 100,
          backgroundColor: "red",
          fillStyle: "solid",
        }),
      ]);
      const dragEndPositionOffset = [100, 100] as const;
      API.setSelectedElements([line]);
      enterLineEditingMode(line, true);
      drag(
        pointFrom(line.points[0][0] + line.x, line.points[0][1] + line.y),
        pointFrom(
          dragEndPositionOffset[0] + line.x,
          dragEndPositionOffset[1] + line.y,
        ),
      );
      expect(line.points).toMatchInlineSnapshot(`
        [
          [
            0,
            0,
          ],
          [
            -60,
            -100,
          ],
        ]
      `);
    });
  });

  describe("Test bound text element", () => {
    const DEFAULT_TEXT = "Online whiteboard collaboration made easy";

    const createBoundTextElement = (
      text: string,
      container: ExcalidrawLinearElement,
    ) => {
      const textElement = API.createElement({
        type: "text",
        x: 0,
        y: 0,
        text: wrapText(text, font, getBoundTextMaxWidth(container, null)),
        containerId: container.id,
        width: 30,
        height: 20,
      }) as ExcalidrawTextElementWithContainer;

      container = {
        ...container,
        boundElements: (container.boundElements || []).concat({
          type: "text",
          id: textElement.id,
        }),
      };

      const elements: ExcalidrawElement[] = [];
      h.elements.forEach((element) => {
        if (element.id === container.id) {
          elements.push(container);
        } else {
          elements.push(element);
        }
      });
      const updatedTextElement = { ...textElement, originalText: text };
      API.setElements([...elements, updatedTextElement]);
      return { textElement: updatedTextElement, container };
    };

    describe("Test getBoundTextElementPosition", () => {
      it("should return correct position for 2 pointer arrow", () => {
        createTwoPointerLinearElement("arrow");
        const arrow = h.elements[0] as ExcalidrawLinearElement;
        const { textElement, container } = createBoundTextElement(
          DEFAULT_TEXT,
          arrow,
        );
        const position = LinearElementEditor.getBoundTextElementPosition(
          container,
          textElement,
          arrayToMap(h.elements),
        );
        expect(position).toMatchInlineSnapshot(`
          {
            "x": 25,
            "y": 10,
          }
        `);
      });

      it("should return correct position for arrow with odd points", () => {
        createThreePointerLinearElement("arrow", {
          type: ROUNDNESS.PROPORTIONAL_RADIUS,
        });
        const arrow = h.elements[0] as ExcalidrawLinearElement;
        const { textElement, container } = createBoundTextElement(
          DEFAULT_TEXT,
          arrow,
        );

        const position = LinearElementEditor.getBoundTextElementPosition(
          container,
          textElement,
          arrayToMap(h.elements),
        );
        expect(position).toMatchInlineSnapshot(`
          {
            "x": 75,
            "y": 60,
          }
        `);
      });

      it("should return correct position for arrow with even points", () => {
        createThreePointerLinearElement("arrow", {
          type: ROUNDNESS.PROPORTIONAL_RADIUS,
        });
        const arrow = h.elements[0] as ExcalidrawLinearElement;
        const { textElement, container } = createBoundTextElement(
          DEFAULT_TEXT,
          arrow,
        );
        enterLineEditingMode(container);
        // This is the expected midpoint for line with round edge
        // hence hardcoding it so if later some bug is introduced
        // this will fail and we can fix it
        const firstSegmentMidpoint = pointFrom<GlobalPoint>(
          55.9697848965255,
          47.442326230998205,
        );
        // drag line from first segment midpoint
        drag(
          firstSegmentMidpoint,
          pointFrom(
            firstSegmentMidpoint[0] + delta,
            firstSegmentMidpoint[1] + delta,
          ),
        );

        const position = LinearElementEditor.getBoundTextElementPosition(
          container,
          textElement,
          arrayToMap(h.elements),
        );
        expect(position).toMatchInlineSnapshot(`
          {
            "x": "86.17305",
            "y": "76.11251",
          }
        `);
      });
    });

    it("should match styles for text editor", async () => {
      createTwoPointerLinearElement("arrow");
      Keyboard.keyPress(KEYS.ENTER);
      const editor = await getTextEditor();
      expect(editor).toMatchSnapshot();
    });

    it("should bind text to arrow when double clicked", async () => {
      createTwoPointerLinearElement("arrow");
      const arrow = h.elements[0] as ExcalidrawLinearElement;

      expect(h.elements.length).toBe(1);
      expect(h.elements[0].id).toBe(arrow.id);
      mouse.doubleClickAt(arrow.x, arrow.y);
      expect(h.elements.length).toBe(2);

      const text = h.elements[1] as ExcalidrawTextElementWithContainer;
      expect(text.type).toBe("text");
      expect(text.containerId).toBe(arrow.id);
      mouse.down();
      const editor = await getTextEditor();

      fireEvent.change(editor, {
        target: { value: DEFAULT_TEXT },
      });

      Keyboard.exitTextEditor(editor);
      expect(arrow.boundElements).toStrictEqual([
        { id: text.id, type: "text" },
      ]);
      expect(
        (h.elements[1] as ExcalidrawTextElementWithContainer).text,
      ).toMatchSnapshot();
    });

    it("should bind text to arrow when clicked on arrow and enter pressed", async () => {
      const arrow = createTwoPointerLinearElement("arrow");

      expect(h.elements.length).toBe(1);
      expect(h.elements[0].id).toBe(arrow.id);

      Keyboard.keyPress(KEYS.ENTER);

      expect(h.elements.length).toBe(2);

      const textElement = h.elements[1] as ExcalidrawTextElementWithContainer;
      expect(textElement.type).toBe("text");
      expect(textElement.containerId).toBe(arrow.id);
      const editor = await getTextEditor();

      fireEvent.change(editor, {
        target: { value: DEFAULT_TEXT },
      });
      Keyboard.exitTextEditor(editor);
      expect(arrow.boundElements).toStrictEqual([
        { id: textElement.id, type: "text" },
      ]);
      expect(
        (h.elements[1] as ExcalidrawTextElementWithContainer).text,
      ).toMatchSnapshot();
    });

    it("should not bind text to line when double clicked", async () => {
      const line = createTwoPointerLinearElement("line");

      expect(h.elements.length).toBe(1);
      mouse.doubleClickAt(line.x, line.y);
      expect(h.elements.length).toBe(1);
    });

    // TODO fix #7029 and rewrite this test
    it.todo(
      "should not rotate the bound text and update position of bound text and bounding box correctly when arrow rotated",
    );

    it("should resize and position the bound text and bounding box correctly when 3 pointer arrow element resized", () => {
      createThreePointerLinearElement("arrow", {
        type: ROUNDNESS.PROPORTIONAL_RADIUS,
      });

      const arrow = h.elements[0] as ExcalidrawLinearElement;

      const { textElement, container } = createBoundTextElement(
        DEFAULT_TEXT,
        arrow,
      );
      expect(container.width).toBe(70);
      expect(container.height).toBe(50);
      expect(
        getBoundTextElementPosition(
          container,
          textElement,
          arrayToMap(h.elements),
        ),
      ).toMatchInlineSnapshot(`
        {
          "x": 75,
          "y": 60,
        }
      `);
      expect(textElement.text).toMatchSnapshot();
      expect(
        LinearElementEditor.getElementAbsoluteCoords(
          container,
          h.app.scene.getNonDeletedElementsMap(),
          true,
        ),
      ).toMatchInlineSnapshot(`
        [
          20,
          20,
          105,
          80,
          "55.45894",
          45,
        ]
      `);

      UI.resize(container, "ne", [300, 200]);

      expect({ width: container.width, height: container.height })
        .toMatchInlineSnapshot(`
          {
            "height": 130,
            "width": "366.11716",
          }
        `);

      expect(
        getBoundTextElementPosition(
          container,
          textElement,
          arrayToMap(h.elements),
        ),
      ).toMatchInlineSnapshot(`
        {
          "x": "271.11716",
          "y": 45,
        }
      `);
      expect(
        (h.elements[1] as ExcalidrawTextElementWithContainer).text,
      ).toMatchSnapshot();
      expect(
        LinearElementEditor.getElementAbsoluteCoords(
          container,
          h.app.scene.getNonDeletedElementsMap(),
          true,
        ),
      ).toMatchInlineSnapshot(`
        [
          20,
          35,
          "501.11716",
          95,
          "205.45894",
          "52.50000",
        ]
      `);
    });

    it("should resize and position the bound text correctly when 2 pointer linear element resized", () => {
      createTwoPointerLinearElement("arrow");

      const arrow = h.elements[0] as ExcalidrawLinearElement;
      const { textElement, container } = createBoundTextElement(
        DEFAULT_TEXT,
        arrow,
      );
      expect(container.width).toBe(40);
      const elementsMap = arrayToMap(h.elements);
      expect(getBoundTextElementPosition(container, textElement, elementsMap))
        .toMatchInlineSnapshot(`
          {
            "x": 25,
            "y": 10,
          }
        `);
      expect(textElement.text).toMatchSnapshot();
      const points = LinearElementEditor.getPointsGlobalCoordinates(
        container,
        elementsMap,
      );

      // Drag from last point
      drag(points[1], pointFrom(points[1][0] + 300, points[1][1]));

      expect({ width: container.width, height: container.height })
        .toMatchInlineSnapshot(`
          {
            "height": 130,
            "width": 340,
          }
        `);

      expect(getBoundTextElementPosition(container, textElement, elementsMap))
        .toMatchInlineSnapshot(`
          {
            "x": 75,
            "y": -5,
          }
        `);
      expect(textElement.text).toMatchSnapshot();
    });

    it("should not render vertical align tool when element selected", () => {
      createTwoPointerLinearElement("arrow");
      const arrow = h.elements[0] as ExcalidrawLinearElement;

      createBoundTextElement(DEFAULT_TEXT, arrow);
      API.setSelectedElements([arrow]);

      expect(queryByTestId(container, "align-top")).toBeNull();
      expect(queryByTestId(container, "align-middle")).toBeNull();
      expect(queryByTestId(container, "align-bottom")).toBeNull();
    });

    it("should wrap the bound text when arrow bound container moves", async () => {
      const rect = UI.createElement("rectangle", {
        x: 400,
        width: 200,
        height: 500,
      });
      const arrow = UI.createElement("arrow", {
        x: -10,
        y: 250,
        width: 400,
        height: 1,
      });

      mouse.select(arrow);
      Keyboard.keyPress(KEYS.ENTER);
      const editor = await getTextEditor();
      fireEvent.change(editor, { target: { value: DEFAULT_TEXT } });
      Keyboard.exitTextEditor(editor);

      const textElement = h.elements[2] as ExcalidrawTextElementWithContainer;

      expect(arrow.endBinding?.elementId).toBe(rect.id);
      expect(arrow.width).toBe(400);
      expect(rect.x).toBe(400);
      expect(rect.y).toBe(0);
      expect(
        wrapText(
          textElement.originalText,
          font,
          getBoundTextMaxWidth(arrow, null),
        ),
      ).toMatchSnapshot();
      const handleBindTextResizeSpy = vi.spyOn(
        textElementUtils,
        "handleBindTextResize",
      );

      mouse.select(rect);
      mouse.downAt(rect.x, rect.y);
      mouse.moveTo(200, 0);
      mouse.upAt(200, 0);
      expect(arrow.width).toBeCloseTo(200, 0);
      expect(rect.x).toBe(200);
      expect(rect.y).toBe(0);
      expect(handleBindTextResizeSpy).toHaveBeenCalledWith(
        h.elements[0],
        h.app.scene,
        "nw",
        false,
      );
      expect(
        wrapText(
          textElement.originalText,
          font,
          getBoundTextMaxWidth(arrow, null),
        ),
      ).toMatchSnapshot();
    });

    it("should not render horizontal align tool when element selected", () => {
      createTwoPointerLinearElement("arrow");
      const arrow = h.elements[0] as ExcalidrawLinearElement;

      createBoundTextElement(DEFAULT_TEXT, arrow);
      API.setSelectedElements([arrow]);

      expect(queryByTestId(container, "align-left")).toBeNull();
      expect(queryByTestId(container, "align-horizontal-center")).toBeNull();
      expect(queryByTestId(container, "align-right")).toBeNull();
    });

    it("should update label coords when a label binded via context menu is unbinded", async () => {
      createTwoPointerLinearElement("arrow");
      const text = API.createElement({
        type: "text",
        text: "Hello Excalidraw",
      });
      expect(text.x).toBe(0);
      expect(text.y).toBe(0);

      API.setElements([h.elements[0], text]);

      const container = h.elements[0];
      API.setSelectedElements([container, text]);
      fireEvent.contextMenu(GlobalTestState.interactiveCanvas, {
        button: 2,
        clientX: 20,
        clientY: 30,
      });
      let contextMenu = document.querySelector(".context-menu");

      fireEvent.click(
        queryByText(contextMenu as HTMLElement, "Bind text to the container")!,
      );
      expect(container.boundElements).toStrictEqual([
        { id: h.elements[1].id, type: "text" },
      ]);
      expect(text.containerId).toBe(container.id);
      expect(text.verticalAlign).toBe(VERTICAL_ALIGN.MIDDLE);

      mouse.reset();
      mouse.clickAt(
        container.x + container.width / 2,
        container.y + container.height / 2,
      );
      mouse.down();
      mouse.up();
      API.setSelectedElements([h.elements[0], h.elements[1]]);

      fireEvent.contextMenu(GlobalTestState.interactiveCanvas, {
        button: 2,
        clientX: 20,
        clientY: 30,
      });
      contextMenu = document.querySelector(".context-menu");
      fireEvent.click(queryByText(contextMenu as HTMLElement, "Unbind text")!);
      expect(container.boundElements).toEqual([]);
      expect(text).toEqual(
        expect.objectContaining({
          containerId: null,
          width: 160,
          height: 25,
          x: -40,
          y: 7.5,
        }),
      );
    });

    it("should not update label position when arrow dragged", () => {
      createTwoPointerLinearElement("arrow");
      let arrow = h.elements[0] as ExcalidrawLinearElement;
      createBoundTextElement(DEFAULT_TEXT, arrow);
      let label = h.elements[1] as ExcalidrawTextElementWithContainer;
      expect(arrow.x).toBe(20);
      expect(arrow.y).toBe(20);
      expect(label.x).toBe(0);
      expect(label.y).toBe(0);
      mouse.reset();
      mouse.select(arrow);
      mouse.select(label);
      mouse.downAt(arrow.x, arrow.y);
      mouse.moveTo(arrow.x + 20, arrow.y + 30);
      mouse.up(arrow.x + 20, arrow.y + 30);

      arrow = h.elements[0] as ExcalidrawLinearElement;
      label = h.elements[1] as ExcalidrawTextElementWithContainer;
      expect(arrow.x).toBe(80);
      expect(arrow.y).toBe(100);
      expect(label.x).toBe(0);
      expect(label.y).toBe(0);
    });
  });

  describe("Test moving linear element points", () => {
    it("should move the endpoint in the negative direction correctly when the start point is also moved in the positive direction", async () => {
      const line = createThreePointerLinearElement("arrow");
      const [origStartX, origStartY] = [line.x, line.y];

      act(() => {
        LinearElementEditor.movePoints(
          line,
          h.app.scene,
          new Map([
            [
              0,
              {
                point: pointFrom(
                  line.points[0][0] + 10,
                  line.points[0][1] + 10,
                ),
              },
            ],
            [
              line.points.length - 1,
              {
                point: pointFrom(
                  line.points[line.points.length - 1][0] - 10,
                  line.points[line.points.length - 1][1] - 10,
                ),
              },
            ],
          ]),
        );
      });
      expect(line.x).toBe(origStartX + 10);
      expect(line.y).toBe(origStartY + 10);

      expect(line.points[line.points.length - 1][0]).toBe(20);
      expect(line.points[line.points.length - 1][1]).toBe(-20);
    });

    it("should preserve original angle when dragging endpoint with SHIFT key", () => {
      createTwoPointerLinearElement("line");
      const line = h.elements[0] as ExcalidrawLinearElement;
      enterLineEditingMode(line);

      const elementsMap = arrayToMap(h.elements);
      const points = LinearElementEditor.getPointsGlobalCoordinates(
        line,
        elementsMap,
      );

      // Calculate original angle between first and last point
      const originalAngle = Math.atan2(
        points[1][1] - points[0][1],
        points[1][0] - points[0][0],
      );

      // Drag the second point (endpoint) with SHIFT key pressed
      const startPoint = pointFrom<GlobalPoint>(points[1][0], points[1][1]);
      const endPoint = pointFrom<GlobalPoint>(
        startPoint[0] + 4,
        startPoint[1] + 4,
      );

      // Perform drag with SHIFT key modifier
      Keyboard.withModifierKeys({ shift: true }, () => {
        mouse.downAt(startPoint[0], startPoint[1]);
        mouse.moveTo(endPoint[0], endPoint[1]);
        mouse.upAt(endPoint[0], endPoint[1]);
      });

      // Get updated points after drag
      const updatedPoints = LinearElementEditor.getPointsGlobalCoordinates(
        line,
        elementsMap,
      );

      // Calculate new angle
      const newAngle = Math.atan2(
        updatedPoints[1][1] - updatedPoints[0][1],
        updatedPoints[1][0] - updatedPoints[0][0],
      );

      // The angle should be preserved (within a small tolerance for floating point precision)
      const angleDifference = Math.abs(newAngle - originalAngle);
      const tolerance = 0.01; // Small tolerance for floating point precision

      expect(angleDifference).toBeLessThan(tolerance);
    });
  });
});
