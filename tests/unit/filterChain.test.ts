import { describe, expect, it } from "vitest";
import {
  connectChain,
  createNotchFilterChain,
} from "../../src/phase2-frequency-cut/filterChain";

class FakeAudioParam {
  value = 0;
}

class FakeAudioNode {
  connections: FakeAudioNode[] = [];
  connect(node: FakeAudioNode): void {
    this.connections.push(node);
  }
}

class FakeBiquadFilterNode extends FakeAudioNode {
  type = "";
  frequency = new FakeAudioParam();
  Q = new FakeAudioParam();
}

class FakeAudioContext {
  createBiquadFilter(): FakeBiquadFilterNode {
    return new FakeBiquadFilterNode();
  }
}

describe("createNotchFilterChain", () => {
  it("creates one configured notch filter per band", () => {
    const context = new FakeAudioContext();
    const filters = createNotchFilterChain(
      context as unknown as BaseAudioContext,
      [
        { low: 300, high: 3000 },
        { low: 8000, high: 9000 },
      ],
    ) as unknown as FakeBiquadFilterNode[];

    expect(filters).toHaveLength(2);
    expect(filters[0].type).toBe("notch");
    expect(filters[0].frequency.value).toBeCloseTo(Math.sqrt(300 * 3000), 5);
    expect(filters[1].frequency.value).toBeCloseTo(Math.sqrt(8000 * 9000), 5);
  });
});

describe("connectChain", () => {
  it("connects source directly to destination when there are no filter nodes", () => {
    const source = new FakeAudioNode();
    const destination = new FakeAudioNode();

    connectChain(
      source as unknown as AudioNode,
      [],
      destination as unknown as AudioNode,
    );

    expect(source.connections).toEqual([destination]);
  });

  it("chains source -> filters -> destination in order", () => {
    const source = new FakeAudioNode();
    const filterA = new FakeAudioNode();
    const filterB = new FakeAudioNode();
    const destination = new FakeAudioNode();

    connectChain(
      source as unknown as AudioNode,
      [filterA as unknown as AudioNode, filterB as unknown as AudioNode],
      destination as unknown as AudioNode,
    );

    expect(source.connections).toEqual([filterA]);
    expect(filterA.connections).toEqual([filterB]);
    expect(filterB.connections).toEqual([destination]);
  });
});
