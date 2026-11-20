#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 EDV163-N-03 人体存在检测系列的配图（SVG）。

产出到 static/img/edk60/：
  edv163-presence-wiring.svg    接线（模组 5 根线 → H3 排针 → EDK60 网络）
  edv163-presence-geometry.svg  安装几何（吊装 vs 侧装、z/挂高/检测范围/屏蔽区）
  edv163-presence-frame.svg     V1.4 帧结构（11+N、校验和覆盖范围、0x81 九字节）

配色与 static/img/edk60/edv11p-*.svg 保持一致（slate + brand），字体走系统雅黑/等宽。
图里所有事实都来自《EDV163-N-03 串口通信协议 V1.4》与本仓库实施指南，改文案请连同指南一起改。
"""
from __future__ import annotations

import os
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "img" / "edk60"

INK = "#0f172a"
SUB = "#64748b"
LINE = "#cbd5e1"
GRID = "#e2e8f0"
CARD = "#fbfdff"
BRAND = "#0b6bcb"
OK = "#15803d"
WARN = "#c2410c"
ERR = "#dc2626"
PURPLE = "#7c3aed"
MUTED = "#94a3b8"

FONT = '"Microsoft YaHei","PingFang SC","Hiragino Sans GB",sans-serif'
MONO = 'Consolas,"Cascadia Mono","Courier New",monospace'


def esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def tw(s: str, fs: float) -> float:
    """粗略文字宽度（CJK≈1.0em，ASCII≈0.55em），仅用于自检排版余量。"""
    w = 0.0
    for ch in s:
        w += fs * (1.0 if ord(ch) > 0x2E80 else 0.55)
    return w


class Svg:
    def __init__(self, width: int, height: int, title: str, desc: str) -> None:
        self.w, self.h = width, height
        self.parts: list[str] = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}" font-family=\'{FONT}\'>',
            f"<title>{esc(title)}</title>",
            f"<desc>{esc(desc)}</desc>",
            f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
        ]

    def add(self, s: str) -> None:
        self.parts.append(s)

    def text(self, x: float, y: float, s: str, fs: float = 13, fill: str = INK,
             anchor: str = "start", weight: str = "400", mono: bool = False,
             opacity: float = 1.0) -> None:
        fam = f' font-family=\'{MONO}\'' if mono else ""
        op = f' opacity="{opacity}"' if opacity != 1.0 else ""
        self.add(f'<text x="{x}" y="{y}" font-size="{fs}" fill="{fill}" '
                 f'text-anchor="{anchor}" font-weight="{weight}"{fam}{op}>{esc(s)}</text>')

    def title(self, s: str, sub: str | None = None) -> None:
        self.text(48, 46, s, 24, INK, weight="700")
        if sub:
            self.text(48, 72, sub, 13, SUB)

    def rect(self, x: float, y: float, w: float, h: float, fill: str = CARD,
             stroke: str = LINE, rx: float = 10, sw: float = 1,
             dash: str | None = None, opacity: float = 1.0) -> None:
        d = f' stroke-dasharray="{dash}"' if dash else ""
        op = f' opacity="{opacity}"' if opacity != 1.0 else ""
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" '
                 f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}{op}/>')

    def line(self, x1: float, y1: float, x2: float, y2: float, stroke: str = LINE,
             sw: float = 1.5, dash: str | None = None, marker: bool = False) -> None:
        d = f' stroke-dasharray="{dash}"' if dash else ""
        m = ' marker-end="url(#arrow)"' if marker else ""
        self.add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" '
                 f'stroke-width="{sw}"{d}{m}/>')

    def path(self, d: str, stroke: str = LINE, sw: float = 1.5, fill: str = "none",
             dash: str | None = None) -> None:
        ds = f' stroke-dasharray="{dash}"' if dash else ""
        self.add(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{ds}/>')

    def circle(self, cx: float, cy: float, r: float, fill: str = BRAND,
               stroke: str = "none", sw: float = 0) -> None:
        self.add(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

    def save(self, path: Path) -> None:
        self.parts.append(
            '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" '
            'markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M 0 0 L 10 5 L 0 10 z" fill="{SUB}"/></marker></defs>'
        )
        self.parts.append("</svg>")
        path.write_text("\n".join(self.parts), encoding="utf-8")


# ---------------------------------------------------------------- 图 1：接线
def fig_wiring() -> Svg:
    s = Svg(1200, 680,
            "EDV163-N-03 与 EDK60 的接线",
            "模组 5 根线经 H3 排针接到 EDK60：上行 T→IO4、下行 A→IO5、电源 V/P→3.3V_RADAR、G→GND、RES 空置；禁止插 H4，禁止带电插拔")
    s.title("接线：模组 5 根线 → H3 排针 → EDK60",
            "H3 与 H4 信号集合相同但顺序相反（H3 = RES A R T G V P ／ H4 = RES P V G R T A）；串口 256000 8N1 无流控")

    heads = [(96, "模组侧（EDV163-N-03）"), (470, "H3 排针（丝印，文档只标注 7 脚）"), (820, "EDK60 侧网络")]
    for x, t in heads:
        s.text(x, 112, t, 12.5, SUB, weight="700")

    rows = [
        ("T", "模组 TX", "T", "第 4 脚", "IO4", "模组 TX → MCU RX ｜ 上行：状态、坐标全靠这条", BRAND, None),
        ("A", "模组 RX", "A", "第 2 脚", "IO5", "MCU TX → 模组 RX ｜ 下行：发 GET / SET", OK, None),
        ("V+P", "3.3 V（两脚并联）", "V / P", None, "3.3V_RADAR", "3.3 V 单电源，不需要电平转换", WARN, None),
        ("G", "GND", "G", None, "GND", "共地（唯一地）", SUB, None),
        ("RES", "复位（本方案不用）", "RES", None, "—", "空置；T-01 的 A/R 定论前不要插满脚", MUTED, "6 4"),
    ]

    y0, dy = 150, 66
    for i, (ml, msub, hl, hsub, net, note, color, dash) in enumerate(rows):
        y = y0 + i * dy
        # 模组侧（引脚名 + 说明都在框内，箭头不再压字）
        s.rect(90, y, 156, 54, "#ffffff", color, rx=8, sw=1.6, dash=dash)
        s.text(168, y + 23, ml, 15, color, "middle", "700", mono=True)
        s.text(168, y + 42, msub, 10.5, SUB, "middle")
        # 排针（丝印 + 脚号都在框内）
        s.rect(462, y, 160, 54, "#ffffff", color, rx=8, sw=1.6, dash=dash)
        s.text(542, y + 23, hl, 14, color, "middle", "700", mono=True)
        if hsub:
            s.text(542, y + 42, hsub, 10.5, MUTED, "middle")
        # 网络
        s.text(820, y + 24, net, 15, color, weight="700", mono=True)
        s.text(820, y + 42, note, 11.5, SUB)
        # 连线
        s.line(246, y + 27, 462, y + 27, color, 1.8, dash, marker=True)
        s.line(622, y + 27, 812, y + 27, color, 1.8, dash, marker=True)

    # 电源使能（板载，不是模组引脚）
    s.rect(90, 492, 520, 66, "#f8fafc", LINE, rx=10)
    s.text(106, 516, "雷达电源使能 = IO14（板载，不从模组取）", 13, INK, weight="700")
    s.text(106, 537, "高有效、上电常高；丝印 RADAR 的红灯亮 = 模组已上电", 12, SUB)

    # 禁止 H4 / 带电插拔
    s.rect(626, 492, 484, 66, "#fff7ed", "#fed7aa", rx=10)
    s.text(642, 516, "✗ 不要插 H4　✗ 不要带电插拔", 13, WARN, weight="700")
    s.text(642, 537, "H4 顺序相反：插错会电源与数据互相干扰，症状是「红灯亮着却一字节都没有」", 11.5, "#9a3412")

    s.text(48, 600, "为什么这 5 根就够：模组只出串口 + 电源；雷达电源使能由板子控制，可通过 IO14 做一次硬复位。", 12.5, SUB)
    s.text(48, 624, "别照抄人数统计 / 水位那两套的引脚顺序——同板不同固件，但 H3 的 T/A 位置一致，最容易错的是「插 H4」。", 12.5, SUB)
    s.text(48, 656, "协议侧：帧长 = 11 + N、无帧尾、不做字节转义（V1.4）。", 12, MUTED)
    return s


# ------------------------------------------------------------ 图 2：安装几何
def _person(s: Svg, x: float, floor: float, color: str = SUB) -> None:
    s.circle(x, floor - 62, 9, "none", color, 2)
    s.add(f'<path d="M {x - 12} {floor - 50} L {x + 12} {floor - 50} L {x + 9} {floor} L {x - 9} {floor} Z" '
          f'fill="none" stroke="{color}" stroke-width="2"/>')


def fig_geometry() -> Svg:
    s = Svg(1200, 660,
            "吊装与侧装的几何差异",
            "吊装：天线朝下，z 有意义，需设挂高 0x25；侧装：天线朝水平，x/y 为主，z 别当身高用；两图都标出检测范围 0x27 与屏蔽区 0x29")
    s.title("装在哪：吊装看 z，侧装看 x/y",
            "同一颗模组、两种姿态；检测范围 0x27 默认 ±3000 mm，屏蔽区 0x29 约束 0 < Z < 挂高")

    # ---- 左：吊装
    s.rect(56, 100, 520, 470, CARD, LINE, rx=12)
    s.text(80, 130, "吊装（天线朝正下方，2.4~3 m 常见）", 14, INK, weight="700")
    ceil, floor = 168, 500
    s.line(80, ceil, 552, ceil, LINE, 3)
    s.text(88, ceil - 8, "天花 / 支架", 11, MUTED)
    s.line(80, floor, 552, floor, LINE, 3)
    s.text(88, floor + 16, "地面 = z 的 0 参考（待实测确认）", 11, MUTED)
    # 雷达
    s.rect(292, ceil + 2, 76, 20, "#ffffff", BRAND, rx=4, sw=1.6)
    s.text(330, ceil + 16, "radar", 10, BRAND, "middle", mono=True)
    # 波束
    s.add(f'<path d="M 300 {ceil + 24} L 196 {floor} L 470 {floor} Z" fill="{BRAND}" opacity="0.06" stroke="{BRAND}" stroke-width="1" stroke-dasharray="5 4"/>')
    # z 轴
    s.line(330, ceil + 26, 330, floor - 4, SUB, 1.6, "5 4", marker=True)
    s.text(338, 300, "z", 13, SUB, weight="700")
    # 挂高
    s.line(150, ceil + 22, 150, floor, PURPLE, 1.6, "4 3")
    s.line(144, ceil + 22, 330, ceil + 22, PURPLE, 1.2, "2 3")
    s.text(160, 322, "挂高 0x25", 12.5, PURPLE, weight="700")
    s.text(160, 338, "1200~5000 mm", 11.5, PURPLE)
    s.text(160, 354, "必须显式下发", 11, SUB)
    # 检测高度
    s.line(500, 320, 500, 430, WARN, 1.6)
    s.line(494, 320, 506, 320, WARN, 1.6)
    s.line(494, 430, 506, 430, WARN, 1.6)
    s.text(514, 370, "0x26", 12, WARN, weight="700")
    s.text(514, 386, "检测高度", 11, WARN)
    # 人 + z 读数
    _person(s, 420, floor, SUB)
    s.text(438, 470, "z ≈ 826 mm", 11.5, SUB)
    s.text(438, 485, "（实测例）", 10.5, MUTED)
    # 屏蔽区
    s.rect(96, floor - 54, 62, 54, "#e2e8f0", MUTED, rx=3, dash="4 3", opacity=0.65)
    s.text(102, floor - 8, "0x29", 10.5, SUB, mono=True)
    s.text(102, floor - 22, "屏蔽区", 10, SUB)
    s.text(356, 236, "0x27 检测范围 ±3000 mm", 11.5, BRAND, weight="700")

    # ---- 右：侧装
    s.rect(624, 100, 520, 470, CARD, LINE, rx=12)
    s.text(648, 130, "侧装（天线朝水平，产品页 0.5~1.8 m）", 14, INK, weight="700")
    wall = 668
    s.line(wall, 168, wall, 500, LINE, 3)
    s.text(wall + 6, 160, "墙 / 立柱", 11, MUTED)
    s.line(648, 500, 1120, 500, LINE, 3)
    s.text(652, 516, "地面", 11, MUTED)
    s.rect(wall + 2, 246, 20, 76, "#ffffff", BRAND, rx=4, sw=1.6)
    s.text(702, 240, "radar", 10, BRAND, mono=True)
    s.line(706, 244, 690, 252, SUB, 1, "2 2")
    s.add(f'<path d="M {wall + 22} 252 L 1096 152 L 1096 416 Z" fill="{BRAND}" opacity="0.06" '
          f'stroke="{BRAND}" stroke-width="1" stroke-dasharray="5 4"/>')
    s.text(wall + 30, 210, "正面扇区：x/y 是主角", 12, BRAND, weight="700")
    _person(s, 900, 500, SUB)
    s.line(900, 470, 900, 430, SUB, 1.2, "3 3")
    # 高度标注
    s.line(1100, 246, 1100, 500, PURPLE, 1.6, "4 3")
    s.text(1088, 380, "0.5~1.8 m", 11.5, PURPLE, "end")
    s.text(648, 420, "z 在这套姿态里不代表身高", 12, WARN, weight="700")
    s.text(648, 438, "（0<Z<挂高 仍成立，但原点未知）", 11, SUB)

    # ---- 底部三条
    s.rect(56, 590, 1088, 64, "#f8fafc", LINE, rx=10)
    s.text(74, 614, "同一套坐标，两种含义", 12.5, INK, weight="700")
    s.text(74, 636, "吊装：z 有意义（但 0 在雷达面还是地面仍待实测）；侧装：x/y 是水平位移，z 不要当身高。两种姿态都是「检测范围 0x27 收窄 + 屏蔽区 0x29 挡掉家具」来解决误判。", 12, SUB)
    return s


# ------------------------------------------------------------ 图 3：帧结构
def fig_frame() -> Svg:
    s = Svg(1200, 780,
            "V1.4 帧结构与 0x81 上报载荷",
            "帧 = 帧头2 + 长度2 + msgid2 + op1 + type1 + len2 + Value(N) + 校验1，整帧 11+N、无帧尾、不转义；校验和为帧头到 Value 末逐字节求和 mod 256；0x81 固定 9 字节单目标")
    s.title("V1.4 的帧长这样：11 + N，没有帧尾",
            "与 V1.1 的根本区别：帧尾 0x0A 已取消、字节转义已废除；拿旧解析器（等 0x0A）读新设备会一帧都解不出")

    # ---- A. 帧结构
    s.text(56, 116, "A. 一整帧（示例取 0x81 主动上报）", 14, INK, weight="700")
    cells = [
        ("帧头", "BYTE1-2", "2", "45 44", 96),
        ("长度", "BYTE3-4", "2", "00 14", 96),
        ("msgid", "BYTE5-6", "2", "00 01", 96),
        ("op", "BYTE7", "1", "A3", 60),
        ("type", "BYTE8", "1", "81", 60),
        ("Value 长度", "BYTE9-10", "2", "00 09", 104),
        ("Value（N 字节）", "BYTE11-10+N", "N", "01 02 01 00 64 00 C8 05 DC", 448),
        ("校验和", "BYTE11+N", "1", "DC", 120),
    ]
    x, y, h = 56.0, 140.0, 76.0
    for name, rng, n, sample, w in cells:
        is_ck = name == "校验和"
        fill = "#fef2f2" if is_ck else "#ffffff"
        stroke = ERR if is_ck else LINE
        s.rect(x, y, w, h, fill, stroke, rx=6, sw=1.6 if is_ck else 1.2)
        s.text(x + w / 2, y + 24, name, 13, ERR if is_ck else INK, "middle", "700")
        s.text(x + w / 2, y + 42, rng, 10.5, SUB, "middle", mono=True)
        s.text(x + w / 2, y + 62, sample, 12.5 if n == "N" else 12,
               ERR if is_ck else BRAND, "middle", "700", mono=True)
        x += w

    # 校验和覆盖范围
    s.line(56, y + h + 16, 56, y + h + 30, SUB, 1.2)
    s.line(1016, y + h + 16, 1016, y + h + 30, SUB, 1.2)
    s.line(56, y + h + 30, 1016, y + h + 30, SUB, 1.6)
    s.text(536, y + h + 48, "校验和 = 这一段逐字节求和 mod 256（不含校验和自己；V1.4 没有帧尾，也没有「帧尾前一个字节」这种说法）",
           12, SUB, "middle")

    # 右侧两条提示
    s.rect(56, 286, 1088, 58, "#f0fdf4", "#bbf7d0", rx=8)
    s.text(72, 308, "✓ 长度字段 = 11 + N（N = Value 字节数）", 12.5, OK, weight="700")
    s.text(72, 328, "N = 0 时是 11 B（例如 GET 0x01 = 45 44 00 0B 00 01 A0 01 00 00 36）；上面这条 20 B = 11 + 9。", 12, "#166534")

    # ---- B. 0x81 载荷
    s.text(56, 386, "B. Value 里装什么：0x81 固定 9 字节、单目标（V1.4 已删 0x13 通道数，没有「每通道」）",
           14, INK, weight="700")
    fields = [
        ("有人/无人", "0 无人 ／ 1 有人", "01", 150, INK),
        ("状态", "0 无人 ／ 1 静止 ／ 2 运动", "02", 170, INK),
        ("方向", "0 静止 ／ 1 靠近 ／ 2 远离", "01", 170, INK),
        ("X", "int16 大端（可负）", "00 64", 180, BRAND),
        ("Y", "int16 大端（可负）", "00 C8", 180, BRAND),
        ("Z", "uint16 大端（无负）", "05 DC", 180, WARN),
    ]
    x, y2, h2 = 56.0, 410.0, 92.0
    for name, desc, sample, w, color in fields:
        s.rect(x, y2, w, h2, "#ffffff", LINE, rx=6, sw=1.2)
        s.text(x + w / 2, y2 + 24, name, 13.5, color, "middle", "700")
        s.text(x + w / 2, y2 + 58, sample, 15, color, "middle", "700", mono=True)
        s.text(x + w / 2, y2 + 78, desc, 10.5, SUB, "middle")
        if name in ("X", "Y", "Z"):
            s.text(x + w / 2, y2 + 40, "2 B", 10, MUTED, "middle", mono=True)
        else:
            s.text(x + w / 2, y2 + 40, "1 B", 10, MUTED, "middle", mono=True)
        x += w
    s.text(56 + 1030, y2 - 10, "9 B", 12, SUB, "end", "700", mono=True)
    s.text(56, y2 + h2 + 26, "示例这条帧 = 有人 · 运动 · 靠近 · X = 100 mm · Y = 200 mm · Z = 1500 mm（Z 是 uint16，所以没有负高度）",
           12, SUB)

    # ---- C. 三条实操结论
    s.text(56, 556, "C. 照这三条写解析器，基本不会错", 14, INK, weight="700")
    tips = [
        ("长度优先", "先读 BYTE3-4 拿整帧长度，再按长度切；不要「遇到 0x0A 就断帧」——V1.4 没有帧尾，正文里的 0x09/0x0A 是合法原值。", OK),
        ("校验定位", "校验和就是整帧最后一个字节（BYTE11+N），不是「帧尾前一个字节」。", OK),
        ("别猜通道", "0x81 就是 9 B 一个目标；长度不是 9 就判「载荷长度异常」并把原始 hex 打出来，别按 7 或 8 去猜。", WARN),
    ]
    yy = 580
    for i, (k, v, color) in enumerate(tips, 1):
        s.circle(68, yy - 4, 9, "#f1f5f9", LINE, 1)
        s.text(68, yy, str(i), 11.5, INK, "middle", "700")
        s.text(90, yy, k, 12.5, color, weight="700")
        s.text(172, yy, v, 12, SUB)
        yy += 30

    s.text(56, 750, "数据源：《EDV163-N-03 串口通信协议 V1.4》（2026-11-04）§2 帧格式、§3 上报数据；示例帧与实施指南 7.5 表一致。",
           11, MUTED)
    return s


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    jobs = [
        ("edv163-presence-wiring.svg", fig_wiring()),
        ("edv163-presence-geometry.svg", fig_geometry()),
        ("edv163-presence-frame.svg", fig_frame()),
    ]
    for name, svg in jobs:
        p = OUT_DIR / name
        svg.save(p)
        print(f"{p.relative_to(OUT_DIR.parent.parent)}  {p.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
