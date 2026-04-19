import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import DiscussionDetail from "./discussionDetail.vue";

vi.mock("./postOnFeed.component.vue", () => ({
  default: {
    name: "postOnFeed",
    template:
      '<div class="post-on-feed-stub">{{ discusionElement.title }}</div>',
    props: ["discusionElement", "depth", "isLast"],
  },
}));

const FAKE_POST = {
  _id: "abc000000000000000000001",
  title: "Mejor combo en cEDH",
  markdown_text: "Thassa + Oracle es el win-con más limpio.",
  likes: 7,
  replyCount: 3,
  createdAt: "2024-01-15T00:00:00.000Z",
  authorId: { username: "tymna_player" },
};

// El componente usa Teleport to="body", así que buscamos en document.body
function q(selector) {
  return document.body.querySelector(selector);
}

async function mountDetail(post = FAKE_POST) {
  const wrapper = mount(DiscussionDetail, {
    props: { post },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  document.body.innerHTML = "";
});

// ── Renderizado ───────────────────────────────────────────────────────────────

describe("renderizado", () => {
  it("muestra el panel tras el montaje", async () => {
    await mountDetail();
    expect(q(".detail-panel")).not.toBeNull();
  });

  it("muestra el eyebrow 'Discusión'", async () => {
    await mountDetail();
    expect(q(".detail-eyebrow").textContent.trim()).toBe("Discusión");
  });

  it("muestra el botón de cerrar", async () => {
    await mountDetail();
    expect(q(".close-btn")).not.toBeNull();
  });

  it("renderiza postOnFeed con el post recibido", async () => {
    await mountDetail();
    const stub = q(".post-on-feed-stub");
    expect(stub).not.toBeNull();
    expect(stub.textContent).toContain("Mejor combo en cEDH");
  });

  it("pasa depth=0 e isLast=true a postOnFeed", async () => {
    const wrapper = await mountDetail();
    const vm = wrapper.findComponent({ name: "postOnFeed" });
    expect(vm.props("depth")).toBe(0);
    expect(vm.props("isLast")).toBe(true);
  });
});

// ── Cerrar ────────────────────────────────────────────────────────────────────

describe("cerrar panel", () => {
  it("emite 'close' al hacer clic en el botón de cerrar", async () => {
    const wrapper = await mountDetail();
    q(".close-btn").click();
    await new Promise((r) => setTimeout(r, 350));
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("emite 'close' al hacer clic en el backdrop", async () => {
    const wrapper = await mountDetail();
    // click.self en el backdrop — disparamos directamente en el backdrop, no en un hijo
    q(".detail-backdrop").dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
    await new Promise((r) => setTimeout(r, 350));
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("no emite 'close' al hacer clic dentro del panel", async () => {
    const wrapper = await mountDetail();
    q(".detail-panel").dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
    await flushPromises();
    expect(wrapper.emitted("close")).toBeFalsy();
  });
});

// ── Props ─────────────────────────────────────────────────────────────────────

describe("prop post", () => {
  it("renderiza el título del post que se le pasa", async () => {
    const post2 = {
      ...FAKE_POST,
      _id: "abc000000000000000000002",
      title: "Otra discusión",
    };
    await mountDetail(post2);
    expect(q(".post-on-feed-stub").textContent).toContain("Otra discusión");
  });
});
