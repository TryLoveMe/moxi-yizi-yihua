/* 一字一画：每个汉字对应的水墨母题，全部在 0..100 局部坐标内作画 */
(function (global) {
  'use strict';
  var M = MoDraw;
  var rnd = M.rnd, rint = M.rint, chance = M.chance, clamp = M.clamp, INK = M.INK, RED = M.RED, BLUE = M.BLUE, GREEN = M.GREEN, GOLD = M.GOLD;

  function stem(ctx, x0, y0, x1, y1, bend, w, alpha) {
    var mx = (x0 + x1) / 2 + bend, my = (y0 + y1) / 2;
    M.stroke(ctx, [{ x: x0, y: y0 }, { x: mx, y: my }, { x: x1, y: y1 }],
      { w: w, w2: w * 0.45, alpha: alpha == null ? 0.75 : alpha, profile: 'taper', dry: 0.3 });
  }

  function angDiff(a, b) {
    var d = (a - b) % 6.2832;
    if (d > Math.PI) d -= 6.2832;
    if (d < -Math.PI) d += 6.2832;
    return d;
  }

  /* 撇叶：根部厚、尖上收死、带一点弧——竹叶、柳叶、兰叶都靠它，两头匀的椭圆是米粒 */
  function taperLeaf(ctx, x, y, ang, len, w, o) {
    o = o || {};
    var c = Math.cos(ang), s = Math.sin(ang);
    var bend = o.bend == null ? 0.16 : o.bend;
    function P(lx, ly) { return { x: x + lx * c - ly * s, y: y + lx * s + ly * c }; }
    var tp = P(len, len * bend), b = P(0, 0);
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 0.7 : o.alpha;
    ctx.fillStyle = o.color || INK;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.bezierCurveTo(P(len * 0.22, w * 0.95).x, P(len * 0.22, w * 0.95).y,
      P(len * 0.72, w * 0.5).x, P(len * 0.72, w * 0.5).y, tp.x, tp.y);
    ctx.bezierCurveTo(P(len * 0.7, -w * 0.3).x, P(len * 0.7, -w * 0.3).y,
      P(len * 0.24, -w * 0.7).x, P(len * 0.24, -w * 0.7).y, b.x, b.y);
    ctx.fill();
    ctx.restore();
  }

  /* 五瓣花：瓣近圆、互不糊成一团，中心浓、蕊散开 */
  function fiveFlower(ctx, x, y, r, color, alpha, core) {
    var pale = color === RED ? '#f7e6d8' : '#fbf0f2';
    var a0 = rnd(0, 6.2832);
    alpha = alpha == null ? 0.85 : alpha;
    // 花气
    M.wash(ctx, x, y, r * 1.5, r * 1.4, { color: color, alpha: alpha * 0.09 });
    for (var i = 0; i < 5; i++) {
      var a = a0 + i / 5 * 6.2832 + rnd(-0.08, 0.08);
      var d = r * rnd(0.44, 0.54);
      M.petal(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, r * rnd(0.42, 0.5), r * rnd(0.38, 0.46), a,
        { color: color, base: pale, tip: M.darken(color, 0.85), alpha: alpha * rnd(0.8, 1), edge: false });
    }
    // 花心与萼
    M.dot(ctx, x, y, r * 0.14, { color: core || '#7d2b26', alpha: 0.8 });
    ctx.save();
    ctx.strokeStyle = M.hexA(core || '#7d2b26', 0.55);
    ctx.lineWidth = Math.max(0.2, r * 0.045);
    for (var k = 0; k < 5; k++) {
      var sa = a0 + k / 5 * 6.2832 + 0.63;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(sa) * r * 0.1, y + Math.sin(sa) * r * 0.1);
      ctx.lineTo(x + Math.cos(sa) * r * 0.34, y + Math.sin(sa) * r * 0.34);
      ctx.stroke();
    }
    // 蕊：十几根散开，尖端一点金
    ctx.strokeStyle = M.hexA(core || '#8a4b3a', 0.6);
    ctx.lineWidth = Math.max(0.18, r * 0.035);
    var n = rint(9, 14);
    for (var s = 0; s < n; s++) {
      var ta = rnd(0, 6.2832), td = rnd(r * 0.28, r * 0.78);
      var tx = x + Math.cos(ta) * td, ty = y + Math.sin(ta) * td;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(ta) * td * 0.5 + rnd(-1, 1), y + Math.sin(ta) * td * 0.5 + rnd(-1, 1), tx, ty);
      ctx.stroke();
      M.dot(ctx, tx, ty, Math.max(0.25, r * 0.055), { color: '#d8a13a', alpha: 0.9 });
    }
    ctx.restore();
  }

  /* 荷花瓣：宽肩、收腰、软尖，根白尖红的竖向渐变 */
  function lotusPetal(ctx, x, y, ang, L, w, o) {
    o = o || {};
    var a = o.alpha == null ? 0.8 : o.alpha;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.PI / 2);
    var g = ctx.createLinearGradient(0, 0, 0, L);
    g.addColorStop(0, M.hexA(o.base || '#fbf4ea', a * 0.85));
    g.addColorStop(0.42, M.hexA(o.color || '#eda3b4', a * 0.8));
    g.addColorStop(0.86, M.hexA(o.color || '#eda3b4', a));
    g.addColorStop(1, M.hexA(o.tip || '#c2557a', a));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-w * 0.42, L * 0.22, -w * 0.62, L * 0.72, 0, L);
    ctx.bezierCurveTo(w * 0.62, L * 0.72, w * 0.42, L * 0.22, 0, 0);
    ctx.fill();
    ctx.strokeStyle = M.hexA(o.tip || '#c2557a', a * 0.3);
    ctx.lineWidth = Math.max(0.18, L * 0.018);
    ctx.stroke();
    // 瓣上筋纹：两三道淡丝
    ctx.strokeStyle = M.hexA(o.tip || '#c2557a', a * 0.16);
    ctx.lineWidth = Math.max(0.12, L * 0.012);
    for (var i = 0; i < 3; i++) {
      var off = (i - 1) * w * 0.24;
      ctx.beginPath();
      ctx.moveTo(off * 0.3, L * 0.2);
      ctx.quadraticCurveTo(off, L * 0.6, off * 0.5, L * 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* 荷花：三层瓣由外而内叠起来，中心莲蓬与金蕊 */
  function lotusFlower(ctx, x, y, r) {
    var back = '#e094a8', deep = '#b04a70';
    M.wash(ctx, x, y - r * 0.25, r * 1.7, r * 1.5, { color: back, alpha: 0.08 });
    // 外层：横展的三瓣，最长也最淡
    var outer = [-1.98, -1.16, -0.42, 0.28];
    for (var i = 0; i < outer.length; i++) {
      lotusPetal(ctx, x + rnd(-0.6, 0.6), y, outer[i] + rnd(-0.06, 0.06),
        r * rnd(1.02, 1.16), r * rnd(0.5, 0.6), { alpha: rnd(0.48, 0.6), color: '#eeb3c1', tip: deep });
    }
    // 中层：立起的四瓣
    var mid = [-2.5, -1.62, -0.9, -0.16];
    for (var k = 0; k < mid.length; k++) {
      lotusPetal(ctx, x + rnd(-0.5, 0.5), y + r * 0.04, mid[k] + rnd(-0.08, 0.08),
        r * rnd(0.9, 1.04), r * rnd(0.46, 0.56), { alpha: rnd(0.68, 0.8), color: back, tip: deep });
    }
    // 内层：正中两瓣最浅，抱着莲蓬
    for (var j = 0; j < 2; j++) {
      lotusPetal(ctx, x, y + r * 0.06, -2.1 + j * 0.62 + rnd(-0.08, 0.08),
        r * rnd(0.7, 0.82), r * rnd(0.4, 0.48), { alpha: 0.86, color: '#f4c1cc', tip: '#c56a88' });
    }
    // 莲蓬：倒扣的小碗，顶面几个莲子
    var pxx = x + rnd(-0.8, 0.8), pyy = y - r * 0.12;
    M.wash(ctx, pxx, pyy + 0.6, r * 0.26, r * 0.14, { color: '#4c5b34', alpha: 0.5 });
    ctx.save();
    ctx.fillStyle = '#6d7b46';
    ctx.beginPath();
    ctx.ellipse(pxx, pyy, r * 0.2, r * 0.13, 0, 0, 6.2832);
    ctx.fill();
    ctx.restore();
    for (var d = 0; d < 4; d++) {
      M.dot(ctx, pxx + rnd(-r * 0.12, r * 0.12), pyy + rnd(-r * 0.06, r * 0.05), r * 0.035,
        { color: '#3a4526', alpha: 0.7 });
    }
    // 金蕊：绕蓬一圈细丝，头重脚轻
    ctx.save();
    ctx.strokeStyle = M.hexA('#d8a53c', 0.8);
    for (var s = 0; s < 14; s++) {
      var sa = rnd(-Math.PI, 0.15), sd = r * rnd(0.24, 0.46);
      var ex = pxx + Math.cos(sa) * sd, ey = pyy + Math.sin(sa) * sd * 0.72;
      ctx.lineWidth = Math.max(0.14, r * 0.022);
      ctx.beginPath();
      ctx.moveTo(pxx, pyy);
      ctx.quadraticCurveTo(pxx + Math.cos(sa) * sd * 0.5, pyy + Math.sin(sa) * sd * 0.4, ex, ey);
      ctx.stroke();
      M.dot(ctx, ex, ey, r * 0.032, { color: '#c8922c', alpha: 0.9 });
    }
    ctx.restore();
  }

  /* 荷叶：湿墨一团，边缘翻卷不齐，梗顶在盘面正中 */
  function lotusLeaf(ctx, x, y, r, o) {
    o = o || {};
    var col = o.color || '#2f4038';
    var a = o.alpha == null ? 0.66 : o.alpha;
    var flat = o.flat == null ? 0.72 : o.flat;
    var notch = o.notch == null ? Math.PI * 0.5 : o.notch;
    var lobes = rint(56, 72);
    var wob = [];
    for (var q = 0; q < 15; q++) wob.push(rnd(0.84, 1.14));
    var lf = rint(3, 5), lph = rnd(0, 6.28);

    function rrAt(ang, scale) {
      var dd = Math.abs(angDiff(ang, notch));
      var ti = ((ang / 6.2832 + 1) % 1) * 14, wi = Math.floor(ti) % 14;
      var w = wob[wi] + (wob[(wi + 1) % 14] - wob[wi]) * (ti % 1);
      return r * scale * w * (1 + 0.08 * Math.sin(ang * lf + lph)) * (dd < 0.5 ? 0.52 + dd * 0.96 : 1);
    }
    function ring(scale) {
      ctx.beginPath();
      for (var i = 0; i <= lobes; i++) {
        var ang = i / lobes * 6.2832, rr = rrAt(ang, scale);
        if (i) ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
        else ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
      }
      ctx.closePath();
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, flat);
    // 盘里一团湿墨：靠梗一侧浓，翻出去的边淡到不见。洇色框在叶形内，不给外圈留一道白边
    ctx.save();
    ring(1);
    ctx.clip();
    var ax = Math.cos(notch + Math.PI) * r * 0.3, ay = Math.sin(notch + Math.PI) * r * 0.3;
    var g = ctx.createRadialGradient(ax, ay, r * 0.04, ax, ay, r * 1.5);
    g.addColorStop(0, M.hexA(M.darken(col, 0.74), a));
    g.addColorStop(0.34, M.hexA(M.darken(col, 0.9), a * 0.92));
    g.addColorStop(0.7, M.hexA(col, a * 0.55));
    g.addColorStop(1, M.hexA(M.lighten(col, 1.6), a * 0.14));
    ctx.fillStyle = g;
    ctx.fillRect(-r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
    // 水痕：顺着叶缘抹几道弧形淡渍，圆的成花斑
    for (var m = 0; m < rint(2, 4); m++) {
      var ma = rnd(0, 6.2832), md = r * rnd(0.25, 0.78);
      ctx.fillStyle = M.hexA(chance(0.6) ? M.darken(col, 0.6) : M.lighten(col, 1.5), a * rnd(0.1, 0.2));
      ctx.beginPath();
      ctx.ellipse(Math.cos(ma) * md, Math.sin(ma) * md, r * rnd(0.3, 0.6), r * rnd(0.08, 0.16), ma + Math.PI / 2, 0, 6.2832);
      ctx.fill();
    }
    // 叶面的大折：宽钝几块浓淡，铺在筋底下，叶才不是一张平灰
    for (var f = 0; f < rint(2, 4); f++) {
      var fa0 = rnd(0, 6.2832), sw = rnd(0.35, 0.8);
      ctx.fillStyle = M.hexA(M.darken(col, 0.62), a * rnd(0.08, 0.16));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * rnd(0.7, 1.1), fa0, fa0 + sw);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // 边缘压一道浓，叶才立得住，不是剪出来的贴纸
    ring(1);
    ctx.strokeStyle = M.hexA(M.darken(col, 0.5), a * 0.42);
    ctx.lineWidth = Math.max(0.22, r * 0.022);
    ctx.stroke();
    // 靠水一边的叶缘再压一道，整片叶才托得住
    ctx.beginPath();
    for (var e = 0; e <= 26; e++) {
      var ea = notch + Math.PI - 1.1 + e / 26 * 2.2, er = rrAt(ea, 1);
      if (e) ctx.lineTo(Math.cos(ea) * er, Math.sin(ea) * er);
      else ctx.moveTo(Math.cos(ea) * er, Math.sin(ea) * er);
    }
    ctx.strokeStyle = M.hexA(M.darken(col, 0.6), a * 0.46);
    ctx.lineWidth = Math.max(0.3, r * 0.028);
    ctx.stroke();
    // 一侧卷起：沿边几道短辐，淡，多就成瓦当纹
    ctx.beginPath();
    for (var c2 = 0; c2 <= 9; c2++) {
      var ca = notch + 1.1 + c2 / 9 * 2.2;
      var cr = rrAt(ca, 1), cri = rrAt(ca, 0.74);
      ctx.moveTo(Math.cos(ca) * cr, Math.sin(ca) * cr);
      ctx.lineTo(Math.cos(ca) * cri, Math.sin(ca) * cri);
    }
    ctx.strokeStyle = M.hexA(M.darken(col, 0.55), a * 0.2);
    ctx.lineWidth = Math.max(0.18, r * 0.02);
    ctx.stroke();
    // 筋：从梗心散到边，白而细，到边前分一下叉——齐到心是伞骨，又粗又直就是车轮辐
    var nv = rint(8, 11);
    for (var v = 0; v < nv; v++) {
      var va = v / nv * 6.2832 + rnd(-0.13, 0.13);
      if (Math.abs(angDiff(va, notch)) < 0.55) continue;
      var vr = rrAt(va, 0.9), st = r * rnd(0.05, 0.14);
      ctx.strokeStyle = M.hexA('#eef0e2', a * rnd(0.18, 0.32));
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(0.14, r * rnd(0.012, 0.022));
      ctx.beginPath();
      ctx.moveTo(Math.cos(va) * st, Math.sin(va) * st);
      ctx.quadraticCurveTo(Math.cos(va + 0.1) * vr * 0.58, Math.sin(va + 0.1) * vr * 0.58,
        Math.cos(va) * vr, Math.sin(va) * vr);
      ctx.stroke();
      if (chance(0.55)) {
        var fa = va + (chance(0.5) ? 0.16 : -0.16), fr = rrAt(fa, 0.88);
        ctx.beginPath();
        ctx.moveTo(Math.cos(va) * vr * 0.72, Math.sin(va) * vr * 0.72);
        ctx.lineTo(Math.cos(fa) * fr, Math.sin(fa) * fr);
        ctx.stroke();
      }
    }
    // 缺口两边各压一道浓，V 才咬得住
    ctx.strokeStyle = M.hexA(M.darken(col, 0.5), a * 0.5);
    ctx.lineWidth = Math.max(0.25, r * 0.028);
    for (var s2 = 0; s2 < 2; s2++) {
      var na = notch + (s2 ? 0.5 : -0.5);
      ctx.beginPath();
      ctx.moveTo(Math.cos(na) * r * 0.26, Math.sin(na) * r * 0.26);
      ctx.quadraticCurveTo(Math.cos(na) * r * 0.62, Math.sin(na) * r * 0.62,
        Math.cos(na + (s2 ? 0.18 : -0.18)) * rrAt(na, 0.97), Math.sin(na + (s2 ? 0.18 : -0.18)) * rrAt(na, 0.97));
      ctx.stroke();
    }
    // 梗顶在盘面正中，压一个浓点收住
    ctx.fillStyle = M.hexA(M.darken(col, 0.5), a * 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.5, r * 0.055), 0, 6.2832);
    ctx.fill();
    ctx.restore();
    // 叶心一汪积水，偏着放
    if (chance(0.6)) {
      M.wash(ctx, x + Math.cos(notch + Math.PI) * r * 0.24, y + Math.sin(notch + Math.PI) * r * 0.24 * flat,
        r * 0.18, r * 0.1, { color: '#f2efe2', alpha: 0.32 });
    }
  }

  /* 松针：从一小段枝上散出去，长短参差、中间留缝——全从一个点射出就是一把扫帚 */
  function needleFan(ctx, x, y, s, alpha) {
    alpha = alpha == null ? 0.62 : alpha;
    M.wash(ctx, x, y - s * 0.25, s * 1.05, s * 0.5, { color: '#2f4038', alpha: alpha * 0.22 });
    var groups = rint(3, 5);
    for (var g = 0; g < groups; g++) {
      var gx = x + rnd(-s * 0.42, s * 0.42), gy = y + rnd(-s * 0.1, s * 0.22);
      var a0 = -Math.PI / 2 + rnd(-1.25, 1.25);
      var n = rint(4, 7);
      for (var i = 0; i < n; i++) {
        var a = a0 + (i - (n - 1) / 2) * rnd(0.16, 0.3);
        var len = s * rnd(0.7, 1.3) * (1 - Math.abs(a - a0) * 0.16);
        taperLeaf(ctx, gx, gy, a, len, len * rnd(0.045, 0.075), {
          color: chance(0.3) ? '#33452f' : INK, alpha: alpha * rnd(0.42, 0.95), bend: rnd(-0.16, 0.16)
        });
      }
      // 每簇中心只需一顿极小的深，大了就成了挂着的一串果
      M.dot(ctx, gx, gy, s * rnd(0.045, 0.075), { color: M.darken(INK, 0.65), alpha: alpha * 0.55 });
    }
  }

  /* 菊叶一类：掌状几裂，底下先垫一团灰，裂口靠留白 */
  function lobedLeaf(ctx, x, y, ang, r, alpha) {
    M.wash(ctx, x + Math.cos(ang) * r * 0.42, y + Math.sin(ang) * r * 0.42, r * 0.82, r * 0.6,
      { color: '#3d4a36', alpha: alpha * 0.26 });
    var n = rint(3, 5);
    for (var i = 0; i < n; i++) {
      var a = ang + (i - (n - 1) / 2) * rnd(0.4, 0.62);
      var len = r * rnd(0.66, 1.06);
      taperLeaf(ctx, x, y, a, len, len * rnd(0.24, 0.36),
        { color: chance(0.3) ? INK : '#3d4a36', alpha: alpha * rnd(0.7, 1.1), bend: rnd(0.12, 0.34) });
    }
    M.stroke(ctx, [{ x: x, y: y }, { x: x + Math.cos(ang) * r * 0.5, y: y + Math.sin(ang) * r * 0.5 }],
      { w: 0.6, w2: 0.22, alpha: alpha * 0.8, profile: 'taper', seg: 4 });
  }

  /* 树冠一团：底下垫两层淡墨定出体积，上面扫小撇叶，边缘散开——撒圆点是蒲公英 */
  function foliage(ctx, x, y, r, alpha) {
    M.wash(ctx, x, y, r * 1.35, r * 1.1, { color: INK, alpha: alpha * 0.2 });
    M.wash(ctx, x - r * 0.2, y - r * 0.15, r * 0.8, r * 0.7, { color: M.darken(INK, 0.7), alpha: alpha * 0.16 });
    var n = Math.round(r * rnd(3.6, 5.2));
    for (var i = 0; i < n; i++) {
      var a = rnd(0, 6.2832), d = Math.pow(rnd(0, 1), 0.5) * r;
      var px = x + Math.cos(a) * d * 1.2, py = y + Math.sin(a) * d * 0.82;
      var len = r * rnd(0.24, 0.5);
      taperLeaf(ctx, px, py, -Math.PI / 2 + rnd(-1.15, 1.15), len, len * rnd(0.22, 0.36), {
        color: chance(0.34) ? M.darken(INK, 0.62) : INK,
        alpha: alpha * rnd(0.45, 1.0) * (1 - d / r * 0.35), bend: rnd(-0.26, 0.26)
      });
    }
    // 团块边缘再扫两三笔长叶，破掉圆轮廓
    for (var e = 0; e < rint(3, 6); e++) {
      var ea = rnd(0, 6.2832);
      taperLeaf(ctx, x + Math.cos(ea) * r * 0.9, y + Math.sin(ea) * r * 0.62, ea - Math.PI / 2 + rnd(-0.6, 0.6),
        r * rnd(0.5, 0.85), r * rnd(0.1, 0.16), { color: INK, alpha: alpha * rnd(0.3, 0.6), bend: rnd(-0.2, 0.2) });
    }
  }

  /* 兰花：三枚窄萼向上散开、两瓣稍短、唇瓣一点紫——五片全朝上就成了星芒 */
  function orchidFlower(ctx, x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    function petal(a, len, w, col, alpha) {
      taperLeaf(ctx, 0, 0, a, len, len * w, { color: col, alpha: alpha, bend: rnd(-0.1, 0.14) });
    }
    for (var i = 0; i < 3; i++) {                        // 萼片：细长，上、左下、右下
      var sa = -Math.PI / 2 + (i - 1) * rnd(2.0, 2.35);
      var sl = r * rnd(1.05, 1.3);
      petal(sa, sl, 0.3, INK, 0.4);
      petal(sa, sl * 0.94, 0.19, '#f4f2e4', 0.95);
    }
    for (var k = 0; k < 2; k++) {                        // 花瓣：短而圆，抱在两侧
      var pa = -Math.PI / 2 + (k ? 1 : -1) * rnd(0.95, 1.2);
      var pl = r * rnd(0.72, 0.92);
      petal(pa, pl, 0.44, INK, 0.34);
      petal(pa, pl * 0.9, 0.32, '#f7f5ea', 0.95);
    }
    // 唇瓣：一小片圆瓣压住中心，点两道紫
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#f4efe0';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.34, r * 0.3, r * 0.24, 0, 0, 6.2832);
    ctx.fill();
    ctx.strokeStyle = M.hexA('#a8557a', 0.85);
    ctx.lineWidth = Math.max(0.35, r * 0.09);
    ctx.beginPath();
    ctx.moveTo(-r * 0.16, r * 0.3); ctx.quadraticCurveTo(0, r * 0.52, r * 0.16, r * 0.3);
    ctx.stroke();
    ctx.fillStyle = M.hexA('#8f4a6c', 0.75);
    ctx.beginPath(); ctx.arc(0, r * 0.3, r * 0.09, 0, 6.2832); ctx.fill();
    ctx.restore();
  }

  /* 以某点为中心的雾光：中心透明、外围淡墨，天然把中心让成留白 */
  function halo(ctx, x, y, r, color, a) {
    ctx.save();
    var g = ctx.createRadialGradient(x, y, r * 0.86, x, y, r * 3.4);
    g.addColorStop(0, M.hexA(color, 0));
    g.addColorStop(0.42, M.hexA(color, a));
    g.addColorStop(1, M.hexA(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, 6.2832); ctx.fill();
    ctx.restore();
  }

  /* 横抹的云气：几道长短不一的湿笔，留出主体的位置 */
  function cloudBands(ctx, y, count, o) {
    o = o || {};
    for (var i = 0; i < count; i++) {
      var yy = y + i * rnd(4, 10) + rnd(-3, 3);
      var x0 = rnd(-4, o.skip || 18), x1 = rnd(70, 104);
      var pts = [{ x: x0, y: yy }];
      for (var s = 1; s <= 5; s++) {
        pts.push({ x: x0 + (x1 - x0) * s / 5, y: yy - Math.sin(s * 1.1 + i) * rnd(1, 3.4) });
      }
      M.stroke(ctx, pts, {
        w: rnd(3, 8), w2: rnd(0.8, 2.4), alpha: o.alpha == null ? rnd(0.1, 0.22) : o.alpha * rnd(0.7, 1.2),
        color: o.color || INK, profile: 'swell', seg: 12, bleed: 0.5, jitter: 0.3
      });
    }
  }

  /* 一抹远山剪影，压住画面下缘 */
  function farHills(ctx, baseY, amp, alpha, color) {
    M.ridge(ctx, -4, 104, baseY, amp, 9, { alpha: alpha, color: color || INK, seed: rnd(0, 6), lw: 0.5, fade: true });
    M.ridge(ctx, -4, 104, baseY + amp * 0.5, amp * 0.55, 7, { alpha: alpha * 0.6, color: color || INK, seed: rnd(0, 6), lw: 0.4, fade: true });
  }

  /* 水面：一条水平墨线 + 疏密有致的波纹，越远越密 */
  function waterLines(ctx, y0, rows, spread, o) {
    o = o || {};
    for (var r = 0; r < rows; r++) {
      var y = Math.min(95, y0 + r * spread);
      var fade = 1 - r / rows * 0.55;
      var x0 = rnd(4, 24 + r * 4), x1 = rnd(66, 92) - r * 2;
      var pts = [{ x: x0, y: y }];
      var seg = rint(3, 5);
      for (var s = 1; s <= seg; s++) {
        pts.push({ x: x0 + (x1 - x0) * s / seg, y: y + rnd(-1.6, 1.6) * fade });
      }
      M.stroke(ctx, pts, {
        w: rnd(0.6, 1.3) * fade, w2: 0.2, alpha: rnd(0.08, 0.2) * fade,
        color: o.color || INK, profile: 'taper', seg: 11, jitter: 0.3
      });
      if (chance(0.35)) {
        var bx = rnd(x0 + 6, x1 - 8);
        M.stroke(ctx, [{ x: bx, y: y + spread * 0.5 }, { x: bx + rnd(6, 16), y: y + spread * 0.5 + rnd(-1, 1) }],
          { w: 1.1, w2: 0.3, alpha: rnd(0.12, 0.3), color: o.color || INK, profile: 'flat' });
      }
    }
  }

  /* 沿切向偏移，用来画枝干的两条边 */
  function nudge(pts, dist) {
    var n = pts.length, out = [];
    for (var i = 0; i < n; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      var dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
      out.push({ x: pts[i].x - dy / L * dist, y: pts[i].y + dx / L * dist });
    }
    return out;
  }

  /* 一条会弯的路径：角度逐步累加，不会出现折线式的急拐 */
  function curve(x0, y0, ang, len, n, curl, wob) {
    var pts = [{ x: x0, y: y0 }], a = ang, px = x0, py = y0, st = len / n;
    for (var i = 1; i <= n; i++) {
      a += curl + rnd(-(wob || 0.1), wob || 0.1);
      px += Math.cos(a) * st; py += Math.sin(a) * st;
      pts.push({ x: px, y: py });
    }
    return pts;
  }

  /* 枝干：淡底 → 主墨 → 背光浓边 → 节，四道才立体 */
  function limb(ctx, pts, o) {
    o = o || {};
    var w = o.w == null ? 5 : o.w, w2 = o.w2 == null ? w * 0.22 : o.w2;
    var col = o.color || INK, seg = o.seg || 9, dk = M.darken(col, 0.55);
    M.stroke(ctx, pts, { w: w * 1.85, w2: w2 * 1.7, alpha: o.washAlpha == null ? 0.055 : o.washAlpha, color: col, profile: 'taper', seg: seg, jitter: 0.55, bleed: 0.3 });
    M.stroke(ctx, nudge(pts, -w * 0.1), { w: w, w2: w2, alpha: o.alpha == null ? 0.78 : o.alpha, color: col, profile: 'taper', seg: seg, dry: o.dry == null ? 0.35 : o.dry, jitter: 0.22 });
    M.stroke(ctx, nudge(pts, w * 0.26), { w: w * 0.36, w2: w2 * 0.35, alpha: o.edgeAlpha == null ? 0.82 : o.edgeAlpha, color: dk, profile: 'taper', seg: seg, dry: 0.5 });
    if (o.joints !== false) {
      for (var i = 1; i < pts.length - 1; i++) {
        if (!chance(0.45)) continue;
        M.dot(ctx, pts[i].x, pts[i].y, w * rnd(0.12, 0.2), { color: dk, alpha: rnd(0.3, 0.55) });
      }
    }
  }

  /* 日月的圆：边缘一路淡掉才不是贴纸，只在背光那侧补一丝浓边 */
  function disc(ctx, x, y, r, color, alpha, rimSide) {
    ctx.save();
    var g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 1.14);
    g.addColorStop(0, M.hexA(color, alpha));
    g.addColorStop(0.78, M.hexA(color, alpha * 0.9));
    g.addColorStop(0.93, M.hexA(color, alpha * 0.42));
    g.addColorStop(1, M.hexA(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 1.16, 0, 6.2832); ctx.fill();
    if (rimSide) {
      var arc = [], a0 = rimSide * 1.57 - 1.1, n = 12;
      for (var i = 0; i <= n; i++) {
        var a = a0 + (2.2 * i / n);
        arc.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });
      }
      M.stroke(ctx, arc, { w: r * 0.07, w2: r * 0.03, alpha: alpha * 0.5, profile: 'flat', seg: 6, color: M.darken(color, 0.6), cap: false });
    }
    ctx.restore();
  }

  /* 一团云：错开的湿抹打底，上缘勾几个相连的滚圈——喷枪的一个椭圆不叫云 */
  function cloudMass(ctx, cx, cy, r, alpha) {
    // 一团云：错开的湿抹打底，上缘两三笔断开的浪圈。抹子叠太密就成了墨饼
    for (var i = 0; i < rint(6, 9); i++) {
      var a = rnd(-3.14, 3.14), d = rnd(0, r * 0.95);
      M.wash(ctx, cx + Math.cos(a) * d * 0.9, cy + Math.sin(a) * d * 0.36,
        r * rnd(0.32, 0.7), r * rnd(0.2, 0.4), { color: INK, alpha: alpha * rnd(0.28, 0.62) });
    }
    var lobes = rint(3, 5), lw = r * rnd(0.045, 0.065), lrs = [], total = 0;
    for (var k = 0; k < lobes; k++) {
      var l0 = r * rnd(0.2, 0.4) * (1 - Math.abs(k - (lobes - 1) / 2) / lobes * 0.5);
      lrs.push(l0); total += l0 * 1.5;
    }
    // 云头是一路连着的浪圈，但一定要断成两三截，通栏一圈就成了毛毛虫
    var arc = [], x = cx - total / 2, brk = {};
    for (k = 0; k < lobes; k++) {
      var l2 = lrs[k];
      for (var q = 0; q <= 6; q++) {
        var aa = Math.PI + q / 6 * Math.PI;
        arc.push({ x: x + l2 + Math.cos(aa) * l2, y: cy - r * 0.16 + Math.sin(aa) * l2 * 0.85 });
      }
      x += l2 * 1.5;
      if (k < lobes - 1 && chance(0.6)) brk[arc.length - rint(1, 2)] = true;
    }
    var run = [];
    for (i = 0; i < arc.length; i++) {
      run.push(arc[i]);
      if (brk[i] || i === arc.length - 1) {
        if (run.length > 3) {
          M.stroke(ctx, run, { w: lw, w2: lw * 0.45, alpha: alpha * rnd(0.5, 0.8),
            profile: 'flat', seg: 6, cap: false, color: M.darken(INK, 0.8), dry: 0.4 });
        }
        run = [];
      }
    }
    // 云脚拖两道横向的湿笔
    for (var f = 0; f < rint(1, 3); f++) {
      var fy = cy + r * rnd(0.2, 0.5);
      M.stroke(ctx, [{ x: cx - r * rnd(1, 1.5), y: fy }, { x: cx, y: fy + rnd(-1, 2) }, { x: cx + r * rnd(1, 1.6), y: fy - rnd(-1, 2) }],
        { w: r * rnd(0.14, 0.26), w2: r * 0.04, alpha: alpha * 0.34, profile: 'swell', seg: 11, bleed: 0.9, jitter: 0.5, cap: false });
    }
  }

  /* 涡纹：一路收紧的螺旋，雷、水波都用它 */
  function spiral(ctx, x0, y0, r0, turns, dir, o) {
    var pts = [], n = Math.round(turns * 16);
    for (var i = 0; i <= n; i++) {
      var t = i / n, a = t * turns * 6.2832 * dir, rr = r0 * (1 - t * 0.84);
      pts.push({ x: x0 + Math.cos(a) * rr, y: y0 + Math.sin(a) * rr * 0.88 });
    }
    M.stroke(ctx, pts, o);
    return pts;
  }

  /* 水纹：一行一行断着走，通栏的直线是栅栏 */
  function ripples(ctx, y0, y1, rows, o) {
    o = o || {};
    for (var r = 0; r < rows; r++) {
      var t = rows <= 1 ? 1 : r / (rows - 1);
      var y = y0 + (y1 - y0) * Math.pow(t, 1.3) + rnd(-0.7, 0.7);
      var x = rnd(-6, 16), parts = rint(1, 3);
      for (var p = 0; p < parts; p++) {
        var x1 = Math.min(104, x + rnd(9, 30) * (0.6 + t * 0.9));
        var pts = [{ x: x, y: y + rnd(-0.5, 0.5) }];
        for (var s = 1; s <= 3; s++) {
          pts.push({ x: x + (x1 - x) * s / 3, y: y + Math.sin(s * 1.6 + r) * (0.4 + t * 1.5) * rnd(0.5, 1.2) });
        }
        M.stroke(ctx, pts, {
          w: (0.45 + t * 1.25) * rnd(0.75, 1.25), w2: 0.2, alpha: (0.08 + t * 0.2) * rnd(0.7, 1.15),
          color: o.color || INK, profile: 'flat', seg: 8, jitter: 0.35, cap: false
        });
        x = x1 + rnd(5, 20);
        if (x > 100) break;
      }
    }
  }

  /* 飞鸟：翅是一根由粗到细的甩笔，两翅同起同落；对称三角片只会变成飞镖 */
  function flyBird(ctx, x, y, s, o) {
    o = o || {};
    var ang = o.ang == null ? rnd(-0.45, 0.45) : o.ang;
    var col = o.color || INK;
    var ph = o.phase == null ? rnd(-0.8, 0.8) : o.phase;   // 正=翅上扬，负=翅下压
    var spread = (o.spread == null ? 0.95 : o.spread) - ph * 0.42;
    var fork = o.fork || 0;
    var c = Math.cos(ang), sn = Math.sin(ang);
    function P(lx, ly) { return { x: x + lx * c - ly * sn, y: y + lx * sn + ly * c }; }
    for (var i = 0; i < 2; i++) {
      var sgn = i ? 1 : -1;
      var a = -Math.PI / 2 + sgn * (spread + rnd(-0.09, 0.09));
      var wp = curve(0, 0, a, s * rnd(0.9, 1.12), 7, sgn * rnd(0.16, 0.26), 0.02);
      var tp = [];
      for (var k = 0; k < wp.length; k++) tp.push(P(wp[k].x, wp[k].y));
      // 翅：根粗梢尖的长镰。放太开是四片羽毛，太细则成了灰线
      M.stroke(ctx, tp, {
        w: s * (i ? 0.3 : 0.36), w2: s * 0.05, alpha: (i ? 0.55 : 0.8) * (o.alpha == null ? 1 : o.alpha),
        color: col, profile: 'taper', seg: 9, cap: false, jitter: 0.1
      });
    }
    var bd = [P(-s * 0.36, 0), P(0, s * 0.02), P(s * 0.3, 0)];
    M.stroke(ctx, bd, { w: s * 0.2, w2: s * 0.07, alpha: 0.85, color: col, profile: 'brush', seg: 8 });
    var hp = P(s * 0.36, -s * 0.02);
    M.dot(ctx, hp.x, hp.y, s * 0.09, { color: col, alpha: 0.9 });
    if (fork > 0) {
      for (var f = 0; f < 2; f++) {
        var fy = (f ? 1 : -1) * s * 0.13;
        M.stroke(ctx, [P(-s * 0.16, fy * 0.25), P(-s * (0.45 + fork), fy)],
          { w: s * 0.1, w2: s * 0.012, alpha: 0.8, color: col, profile: 'taper', seg: 7, cap: false });
      }
    }
  }

  /* 走兽：躯干是一整块有厚度的实体，腿从实体里长出来，颈肩相连。
     椭圆身子插四根筷子，是所有畜口画崩的共同原因 */
  function beast(ctx, x, y, s, o) {
    o = o || {};
    var dir = o.dir || 1;
    var col = o.color || INK;
    var dk = o.dark || M.darken(col, 0.5);
    var hump = o.hump == null ? 0 : o.hump;
    var alpha = o.alpha == null ? 0.72 : o.alpha;
    var dep = o.depth == null ? 0.4 : o.depth;
    function P(nx, ny) { return { x: x + nx * s * dir, y: y + ny * s }; }
    function path(pts) { return M.smooth(pts, 6); }
    function fillPts(pts, style) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = style;
      ctx.fill();
      ctx.restore();
    }
    // 背线：臀甲高、腰微塌、肩前又挑起；腹线沉到 dep
    var topRaw = [P(-1.06, -0.02), P(-0.9, -0.28 - hump * 0.1), P(-0.5, -0.35 - hump * 0.16),
                  P(-0.02, -0.3), P(0.34, -0.36 - hump * 0.06), P(0.62, -0.24)];
    var botRaw = [P(0.78, -0.04), P(0.74, dep * 0.66), P(0.42, dep), P(-0.02, dep * 0.95),
                  P(-0.5, dep * 0.76), P(-0.86, dep * 0.34), P(-1.06, -0.02)];
    var spine = path(topRaw), belly = path(botRaw);
    var bodyPts = spine.concat(belly);
    // 顺序：远腿 → 颈 → 身 → 近腿 → 头，接缝都压在身子底下
    var ll = o.legLen == null ? 0.98 : o.legLen, lw = o.legW == null ? 0.12 : o.legW;
    var legs = [
      { p: [[0.56, dep * 0.1], [0.66, dep * 0.6], [0.6, (dep + ll) * 0.55], [0.63, ll]], far: 1 },
      { p: [[-0.72, dep * 0.04], [-0.94, dep * 0.34], [-0.76, (dep + ll) * 0.55], [-0.8, ll]], far: 1 },
      { p: [[0.44, dep * 0.08], [0.54, dep * 0.62], [0.5, (dep + ll) * 0.55], [0.53, ll]], far: 0 },
      { p: [[-0.56, -0.02], [-0.82, dep * 0.3], [-0.6, (dep + ll) * 0.55], [-0.63, ll]], far: 0 }
    ];
    function leg(L) {
      var pts = L.p.map(function (q) { return P(q[0], q[1]); });
      var a = L.far ? alpha * 0.38 : alpha * 0.86;
      var cu = pts.slice(0, 3), cl = pts.slice(2);
      // 大腿一节、小腿一节：一节节等粗的管子是玩具，干笔在肉里刮出横纹是梳齿
      M.stroke(ctx, cu, { w: s * lw * (L.far ? 1.1 : 1.35), w2: s * lw * 0.92, alpha: a, color: col, profile: 'flat', seg: 9, cap: false });
      M.stroke(ctx, cl, { w: s * lw * 0.85, w2: s * lw * 0.6, alpha: a, color: col, profile: 'flat', seg: 8, cap: false });
      var foot = pts[pts.length - 1], pv = pts[pts.length - 2];
      var fa = Math.atan2(foot.y - pv.y, foot.x - pv.x);
      M.stroke(ctx, [{ x: foot.x - Math.cos(fa) * s * lw * 0.16, y: foot.y - Math.sin(fa) * s * lw * 0.16 },
                     { x: foot.x + Math.cos(fa) * s * lw * 0.3, y: foot.y + Math.sin(fa) * s * lw * 0.3 + s * lw * 0.16 }],
        { w: s * lw * 0.95, w2: s * lw * 0.8, alpha: a * 0.95, color: dk, profile: 'flat', seg: 4, cap: false });
    }
    legs.forEach(function (L) { if (L.far) leg(L); });

    // 颈：从肩前挑出去，根粗梢细，一笔走到底不留接缝
    var nk = o.neck || { ang: -0.9, len: 0.85, w: 0.3 };
    var neck = [], st = nk.len / 5, nnx = 0.42, nny = -0.16, aa = nk.ang;
    for (var n = 0; n <= 5; n++) {
      neck.push(P(nnx, nny));
      aa += (o.neckCurl == null ? -0.06 : o.neckCurl);
      nnx += Math.cos(aa) * st; nny += Math.sin(aa) * st;
    }
    M.stroke(ctx, neck, { w: s * nk.w * 1.4, w2: s * nk.w * 0.6, alpha: alpha * 0.8, color: col, profile: 'flat', seg: 9, dry: 0.12, cap: false });

    // 躯干：上浓下淡的一整块，腹边留一道奶白
    var g = ctx.createLinearGradient(0, y - s * 0.38, 0, y + s * dep);
    g.addColorStop(0, M.colA(dk, alpha));
    g.addColorStop(0.32, M.colA(col, alpha * 0.95));
    g.addColorStop(0.7, M.colA(col, alpha * 0.78));
    g.addColorStop(1, M.colA(o.belly || '#f2e8d2', alpha * 0.62));
    fillPts(bodyPts, g);
    // 脊上压一道浓边，身子才有厚度
    M.stroke(ctx, spine, { w: s * 0.13, w2: s * 0.05, alpha: alpha * 0.66, color: dk, profile: 'taper', seg: 10, dry: 0.18, cap: false });
    // 臀肩的体积靠轮廓上的一道暗弯，不靠两团墨饼
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(bodyPts[0].x, bodyPts[0].y);
    for (var bi = 1; bi < bodyPts.length; bi++) ctx.lineTo(bodyPts[bi].x, bodyPts[bi].y);
    ctx.closePath(); ctx.clip();
    var rump = spine.slice(0, Math.round(spine.length * 0.4));
    M.stroke(ctx, nudge(rump, s * 0.14), { w: s * 0.2, w2: s * 0.06, alpha: alpha * 0.13, color: dk, profile: 'taper', seg: 9, cap: false });
    var sh = spine.slice(Math.round(spine.length * 0.6));
    M.stroke(ctx, nudge(sh, s * 0.12), { w: s * 0.16, w2: s * 0.05, alpha: alpha * 0.11, color: dk, profile: 'taper', seg: 9, cap: false });
    M.wash(ctx, P(0.1, dep * 0.82).x, P(0.1, dep * 0.82).y, s * 0.7, s * 0.16, { color: o.belly || '#f2e8d2', alpha: 0.4 });
    ctx.restore();
    legs.forEach(function (L) { if (!L.far) leg(L); });

    // 头：颈端直接楔出去，耳生在顶上，不是插在脑后的旗
    var hd = neck[neck.length - 1], hpv = neck[neck.length - 2];
    var ha = Math.atan2(hd.y - hpv.y, hd.x - hpv.x);   // 取屏幕上的颈向，朝左时才不会翻过去
    var up = dir > 0 ? -Math.PI / 2 : Math.PI / 2, rs = dir > 0 ? 1 : -1;
    var hl = (o.headLen == null ? 0.5 : o.headLen) * s;
    var poll = { x: hd.x - Math.cos(ha) * hl * 0.28, y: hd.y - Math.sin(ha) * hl * 0.28 };
    var nrm = ha + up;
    if (o.head === 'round') {
      ctx.save();
      var rg = ctx.createLinearGradient(hd.x - hl * 0.5, hd.y - hl * 0.5, hd.x + hl * 0.4, hd.y + hl * 0.5);
      rg.addColorStop(0, M.colA(o.belly || '#f2e8d2', alpha * 0.9));
      rg.addColorStop(0.55, M.colA(o.headColor || col, alpha * 0.86));
      rg.addColorStop(1, M.colA(dk, alpha * (o.headAlpha == null ? 0.7 : o.headAlpha)));
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(hd.x, hd.y, hl * 0.6, hl * 0.54, ha * 0.3, 0, 6.2832);
      ctx.fill();
      ctx.restore();
      var mnp = { x: hd.x + Math.cos(ha) * hl * 0.44, y: hd.y + Math.sin(ha) * hl * 0.44 };
      M.wash(ctx, mnp.x, mnp.y, hl * 0.3, hl * 0.24, { color: o.muzzleColor || '#f6efdc', alpha: 0.6 });
      M.dot(ctx, mnp.x, mnp.y, hl * 0.07, { color: dk, alpha: alpha });
      for (var e = 0; e < 2; e++) {
        var es = e ? 1 : -1;
        var eb = { x: hd.x + Math.cos(nrm) * hl * 0.34 + Math.cos(ha) * hl * (e ? 0.16 : -0.06),
                   y: hd.y + Math.sin(nrm) * hl * 0.34 + Math.sin(ha) * hl * (e ? 0.16 : -0.06) };
        taperLeaf(ctx, eb.x, eb.y, nrm + es * rs * rnd(0.18, 0.36), hl * rnd(0.3, 0.4), hl * 0.2,
          { color: o.earColor || col, alpha: alpha * 0.95, bend: es * rs * 0.08 });
      }
    } else {
      var mk = o.muzzleDip == null ? 0.3 : o.muzzleDip;
      var m0 = { x: poll.x, y: poll.y };
      var brow = { x: hd.x + Math.cos(nrm) * hl * 0.2, y: hd.y + Math.sin(nrm) * hl * 0.2 };
      var m1 = { x: hd.x + Math.cos(ha + mk * rs) * hl * 0.92, y: hd.y + Math.sin(ha + mk * rs) * hl * 0.92 };
      var jaw = { x: hd.x + Math.cos(ha + 0.9 * rs) * hl * 0.5, y: hd.y + Math.sin(ha + 0.9 * rs) * hl * 0.5 };
      var hg = ctx.createLinearGradient(m0.x, m0.y - hl * 0.3, m1.x, m1.y + hl * 0.2);
      // 头是身上最亮的一块，通体压成浓墨就成了野猪
      hg.addColorStop(0, M.colA(o.headTop || dk, alpha * (o.headAlpha == null ? 0.86 : o.headAlpha)));
      hg.addColorStop(0.5, M.colA(o.headColor || col, alpha * 0.82));
      hg.addColorStop(1, M.colA(o.headColor || col, alpha * 0.6));
      fillPts(M.smooth([m0, brow, { x: m1.x - hl * 0.06, y: m1.y - hl * 0.14 }, m1, jaw, m0], 7), hg);
      M.wash(ctx, (hd.x + m1.x) / 2, (hd.y + m1.y) / 2 + hl * 0.12, hl * 0.4, hl * 0.26, { color: o.belly || '#f2eef5', alpha: 0.3 });
      M.dot(ctx, m1.x, m1.y, s * 0.05, { color: dk, alpha: alpha });
      if (o.ears !== false && !o.horns) {
        for (var q = 0; q < 2; q++) {
          var qs = q ? 1 : -1;
          var er = { x: hd.x + Math.cos(nrm) * hl * 0.14, y: hd.y + Math.sin(nrm) * hl * 0.14 };
          taperLeaf(ctx, er.x, er.y, nrm + qs * rs * rnd(0.28, 0.5), hl * rnd(0.22, 0.3), hl * 0.15,
            { color: col, alpha: (q ? 0.9 : 0.5) * alpha, bend: qs * rs * 0.14 });
        }
      }
      if (o.horns) {
        // 两角一前一后长在额顶，往外挑再往上收。都从眉心起笔就成了打在脸上的叉
        for (var h = 0; h < 2; h++) {
          var hs2 = h ? 1 : -1;
          var hb = { x: hd.x + Math.cos(nrm) * hl * 0.16 + Math.cos(ha) * hl * hs2 * 0.14,
                     y: hd.y + Math.sin(nrm) * hl * 0.16 + Math.sin(ha) * hl * hs2 * 0.14 };
          var hp2 = curve(hb.x, hb.y, nrm + hs2 * rs * rnd(0.3, 0.5), s * (o.hornSpan || 0.5) * rnd(0.8, 1.0), 7, -hs2 * rs * rnd(0.08, 0.16), 0.02);
          M.stroke(ctx, hp2, { w: s * 0.11, w2: s * 0.018, alpha: (h ? 0.72 : 0.5) * (o.hornAlpha == null ? 1 : o.hornAlpha),
            color: o.hornColor || '#5f574a', profile: 'taper', seg: 8, cap: false });
        }
      }
    }
    var eye = { x: hd.x + Math.cos(ha) * hl * 0.1 + Math.cos(nrm) * hl * 0.16, y: hd.y + Math.sin(ha) * hl * 0.1 + Math.sin(nrm) * hl * 0.16 };
    M.dot(ctx, eye.x, eye.y, s * 0.03, { color: o.light || '#f4ecd8', alpha: 0.85 });

    // 鬃：往后倒的一把毛，压在颈脊上，不是从脖子上竖出来的刺
    if (o.mane) {
      var crest = [], cnrm = [];
      for (var ci = 0; ci < neck.length; ci++) {
        var r = neck[Math.max(0, ci - 1)], t2 = neck[Math.min(neck.length - 1, ci + 1)];
        var an = Math.atan2(t2.y - r.y, t2.x - r.x) + up;
        cnrm.push(an);
        crest.push({ x: neck[ci].x + Math.cos(an) * s * nk.w * 0.42, y: neck[ci].y + Math.sin(an) * s * nk.w * 0.42 });
      }
      M.stroke(ctx, crest, { w: s * nk.w * 0.16, w2: s * nk.w * 0.1, alpha: alpha * 0.22, color: dk, profile: 'flat', seg: 8, cap: false });
      var mn = rint(7, 10);
      for (var m = 0; m < mn; m++) {
        var mi = clamp(Math.round(m / mn * (crest.length - 2)), 1, crest.length - 2);
        var root = crest[mi];
        var along = Math.atan2(crest[mi - 1].y - root.y, crest[mi - 1].x - root.x);
        // 披向肩后，同时倒进颈内侧：两个方向合成，毛才贴在脖子上而不是戳在外面
        var vx = Math.cos(along) * 0.62 + Math.cos(cnrm[mi] + Math.PI) * 0.38;
        var vy = Math.sin(along) * 0.62 + Math.sin(cnrm[mi] + Math.PI) * 0.38;
        var dr = Math.atan2(vy, vx);
        var L = s * nk.w * rnd(0.5, 0.9);
        M.stroke(ctx, [root,
          { x: root.x + Math.cos(dr) * L * 0.6, y: root.y + Math.sin(dr) * L * 0.6 },
          { x: root.x + Math.cos(dr) * L, y: root.y + Math.sin(dr) * L + s * 0.05 }],
          { w: s * nk.w * rnd(0.07, 0.11), w2: s * 0.006, alpha: rnd(0.14, 0.24), color: dk, profile: 'taper', seg: 6, cap: false });
      }
      // 额前一把鬃，头颈才有接续
      var fl = curve(hd.x + Math.cos(nrm) * hl * 0.24, hd.y + Math.sin(nrm) * hl * 0.24, ha + 2.5 * rs, hl * 0.5, 6, -0.14 * rs, 0.02);
      M.stroke(ctx, fl, { w: s * 0.05, w2: s * 0.01, alpha: 0.28, color: dk, profile: 'taper', seg: 6, cap: false });
    }
    if (o.tail) {
      var tb = P(-1.04, -0.06);
      var ta = (dir > 0 ? Math.PI : 0) - (o.tailUp ? -0.5 : 0.4) * dir;
      var tp2 = curve(tb.x, tb.y, ta, s * o.tail, 8, (o.tailCurl == null ? 0.1 : o.tailCurl) * (dir > 0 ? -1 : 1), 0.05);
      M.stroke(ctx, tp2, { w: s * 0.16, w2: s * 0.05, alpha: alpha * 0.85, color: col, profile: 'taper', seg: 9, cap: false });
      if (o.tailHair) {
        var tsp = M.smooth(tp2, 8);
        // 毛只长在尾梢，根部那截是光溜的尾椎；整条都炸毛就成了黑刷子
        for (var th = Math.round(tsp.length * 0.55); th < tsp.length; th += 3) {
          var pq = tsp[th], nx = tsp[Math.min(tsp.length - 1, th + 3)];
          var ba = Math.atan2(nx.y - pq.y, nx.x - pq.x);
          M.stroke(ctx, [pq, { x: nx.x + Math.cos(ba + rnd(-0.3, 0.3)) * s * rnd(0.16, 0.28), y: nx.y + Math.sin(ba + rnd(-0.1, 0.55)) * s * rnd(0.16, 0.28) }],
            { w: s * 0.03, w2: 0.05, alpha: 0.22, color: col, profile: 'taper', seg: 4, cap: false });
        }
      }
    }
    // 蹄下一片影，畜口才站得住
    M.wash(ctx, x, y + s * (ll + 0.06), s * 1.35, s * 0.13, { color: INK, alpha: 0.16 });
    return { head: hd, neck: neck, spine: spine, belly: belly };
  }

  /* 屋顶：一座房子最要紧的就是这一片墨。只勾轮廓是工程图，铺墨 + 瓦垄 + 挑角才是画。
     cy 是檐口，w 是半跨，rise/flick/sag 都按 w 折算 */
  function eave(ctx, cx, cy, w, o) {
    o = o || {};
    var rise = (o.rise == null ? 0.52 : o.rise) * w;
    var flick = (o.flick == null ? 0.16 : o.flick) * w;
    var sag = (o.sag == null ? 0.1 : o.sag) * w;
    var col = o.color || INK;
    var dk = o.dark || M.darken(col, 0.62);
    var am = o.alpha == null ? 0.8 : o.alpha;
    var L = { x: cx - w, y: cy - flick }, R = { x: cx + w, y: cy - flick };
    var tip = { x: cx, y: cy - rise };
    var edge = [];
    for (var i = 0; i <= 12; i++) {
      var t = i / 12;
      edge.push({ x: cx - w + 2 * w * t, y: cy - flick + (flick + sag) * Math.sin(Math.PI * t) });
    }
    function outline() {
      ctx.beginPath();
      ctx.moveTo(L.x, L.y);
      ctx.quadraticCurveTo(cx - w * 0.52, cy - rise * 0.66, tip.x, tip.y);
      ctx.quadraticCurveTo(cx + w * 0.52, cy - rise * 0.66, R.x, R.y);
      for (var j = edge.length - 1; j >= 0; j--) ctx.lineTo(edge[j].x, edge[j].y);
      ctx.closePath();
    }
    ctx.save();
    outline();
    var g = ctx.createLinearGradient(0, tip.y, 0, cy + sag);
    g.addColorStop(0, M.colA(dk, am * 0.52));
    g.addColorStop(0.42, M.colA(col, am * 0.44));
    g.addColorStop(0.85, M.colA(col, am * 0.3));
    g.addColorStop(1, M.colA('#f4ead6', am * 0.2));
    ctx.fillStyle = g;
    ctx.fill();
    // 瓦垄：从中脊散到檐口的一根根，密而不重
    ctx.clip();
    ctx.strokeStyle = M.colA(dk, am * 0.15);
    ctx.lineWidth = Math.max(0.25, w * 0.011);
    for (var k = 0; k <= 12; k++) {
      var tk = k / 12;
      var ex = cx - w + 2 * w * tk;
      var ey = cy - flick + (flick + sag) * Math.sin(Math.PI * tk);
      var rx = cx + (ex - cx) * 0.3, ry = tip.y + (cy - tip.y) * 0.08;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo((rx + ex) / 2 + (ex - cx) * 0.04, (ry + ey) / 2, ex, ey);
      ctx.stroke();
    }
    ctx.restore();
    // 檐口受光的一道白，屋顶才翻得起来
    M.stroke(ctx, edge, { w: w * 0.05, w2: w * 0.03, alpha: am * 0.5, color: '#f6efdc', profile: 'flat', seg: 9, cap: false });
    // 四角往上挑的垂脊：一笔到角，角上再飞出去一点
    [[-1, L], [1, R]].forEach(function (sd) {
      var fly = { x: sd[1].x + sd[0] * w * 0.07, y: sd[1].y - flick * 0.55 };
      M.stroke(ctx, [{ x: tip.x, y: tip.y },
        { x: cx + sd[0] * w * 0.52, y: cy - rise * 0.66 },
        sd[1], fly], { w: w * 0.07, w2: w * 0.016, alpha: am, color: dk, profile: 'taper', seg: 9, cap: false });
      M.dot(ctx, fly.x, fly.y, w * 0.022, { color: dk, alpha: am * 0.8 });
    });
    // 正脊：顶上压一道，两头略粗
    M.stroke(ctx, [{ x: cx - w * 0.2, y: tip.y }, { x: cx + w * 0.2, y: tip.y }],
      { w: w * 0.075, w2: w * 0.075, alpha: am * 0.9, color: dk, profile: 'flat', seg: 5, cap: false });
    return { edge: edge, tip: tip, left: L, right: R, cy: cy, w: w };
  }

  /* 柱：一根有浓淡的竖笔，旁边留一道白才圆；等粗的一条线是脚手架 */
  function post(ctx, x, y0, y1, w, o) {
    o = o || {};
    var col = o.color || INK, am = o.alpha == null ? 0.7 : o.alpha;
    M.stroke(ctx, [{ x: x, y: y0 }, { x: x + (o.lean || 0) * w, y: (y0 + y1) / 2 }, { x: x, y: y1 }],
      { w: w, w2: w * 0.88, alpha: am, color: col, profile: 'flat', seg: 7, cap: false });
    M.stroke(ctx, [{ x: x - w * 0.3, y: y0 + w }, { x: x - w * 0.3, y: y1 - w * 0.4 }],
      { w: w * 0.16, w2: w * 0.1, alpha: am * 0.45, color: M.darken(col, 0.6), profile: 'flat', seg: 6, cap: false });
  }

  /* 墙/台基：上白下暗的一层，脚下一条浓线 */
  function wall(ctx, x0, y0, x1, y1, o) {
    o = o || {};
    var col = o.color || INK, am = o.alpha == null ? 0.8 : o.alpha;
    ctx.save();
    var g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, M.colA('#f4ead6', 0.6 * am));
    g.addColorStop(0.7, M.colA(col, 0.14 * am));
    g.addColorStop(1, M.colA(col, 0.26 * am));
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.restore();
    M.stroke(ctx, [{ x: x0, y: y1 }, { x: x1, y: y1 }],
      { w: Math.max(0.9, (y1 - y0) * 0.1), w2: 0.4, alpha: am * 0.62, color: col, profile: 'flat', seg: 6, cap: false });
  }

  /* 轮：辋有两层的厚度，辐的角度不齐，毂心一点白。一圈等粗的圆加八根等分的辐条是自行车 */
  function wheel(ctx, cx, cy, r, o) {
    o = o || {};
    var col = o.color || INK, am = o.alpha == null ? 0.8 : o.alpha, fl = o.flat == null ? 1 : o.flat;
    var pts = [];
    for (var i = 0; i <= 20; i++) {
      var a = i / 20 * 6.2832;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * fl });
    }
    M.stroke(ctx, pts, { w: r * 0.17, w2: r * 0.15, alpha: am * 0.8, color: col, profile: 'flat', seg: 6, cap: false });
    M.stroke(ctx, pts, { w: r * 0.06, w2: r * 0.05, alpha: am * 0.45, color: M.darken(col, 0.6), profile: 'flat', seg: 6, cap: false });
    var ns = rint(6, 9), a0 = rnd(0, 1);
    for (var k = 0; k < ns; k++) {
      var sa = a0 + (k + rnd(0, 0.34)) / ns * 6.2832;
      M.stroke(ctx, [{ x: cx + Math.cos(sa) * r * 0.18, y: cy + Math.sin(sa) * r * 0.18 * fl },
        { x: cx + Math.cos(sa) * r * 0.88, y: cy + Math.sin(sa) * r * 0.88 * fl }],
        { w: r * 0.06, w2: r * 0.035, alpha: am * 0.66, color: col, profile: 'flat', seg: 5, cap: false });
    }
    M.dot(ctx, cx, cy, r * 0.18, { color: M.darken(col, 0.7), alpha: am });
    M.dot(ctx, cx, cy, r * 0.07, { color: '#f4ead6', alpha: am * 0.85 });
  }

  /* 草虫：头胸腹三段 + 一对半透的翅 + 六条带节的腿。
     一团实心墨加六根直线，是所有虫口画崩的共同原因 */
  function bug(ctx, x, y, s, o) {
    o = o || {};
    var ang = o.ang == null ? rnd(-0.4, 0.4) : o.ang;
    var dir = o.dir || 1;
    var col = o.color || INK;
    var dk = M.darken(col, 0.55);
    var c = Math.cos(ang), sn = Math.sin(ang);
    function P(lx, ly) { lx *= dir * s; ly *= s; return { x: x + lx * c - ly * sn, y: y + lx * sn + ly * c }; }
    function ell(cx, cy, rx, ry, rot, fill, edge) {
      var p = P(cx, cy);
      ctx.save();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rx, ry, rot * dir + ang, 0, 6.2832);
      ctx.fill();
      if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = Math.max(0.16, s * 0.03); ctx.stroke(); }
      ctx.restore();
    }
    // 翅：一层淡纱 + 只描前缘半圈；整圈描下来就成了铁环
    function wing(cx, cy, rx, ry, rot, a) {
      var p = P(cx, cy);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(rot * dir + ang);
      var wg = ctx.createLinearGradient(-rx, 0, rx, 0);
      wg.addColorStop(0, M.hexA('#ece3ca', 0.5 * a));
      wg.addColorStop(0.62, M.hexA('#f7f2e2', 0.4 * a));
      wg.addColorStop(1, M.hexA('#f7f2e2', 0.04));
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = M.hexA(col, 0.4 * a);
      ctx.lineWidth = Math.max(0.16, s * 0.026);
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, Math.PI * 1.03, Math.PI * 1.97); ctx.stroke();
      ctx.strokeStyle = M.hexA(col, 0.2 * a);
      ctx.lineWidth = Math.max(0.1, s * 0.016);
      for (var v = 0; v < 3; v++) {
        var t = (v - 1) * 0.6;
        ctx.beginPath();
        ctx.moveTo(-rx * 0.78, 0);
        ctx.quadraticCurveTo(0, ry * t * 1.1, rx * 0.86, ry * t * 0.82);
        ctx.stroke();
      }
      ctx.restore();
    }
    var legs = o.legs == null ? 3 : o.legs;
    var lr = o.legReach == null ? 1 : o.legReach;
    for (var l = 0; l < legs * 2; l++) {
      var side = l % 2 ? 1 : -1;
      var t = Math.floor(l / 2) / Math.max(1, legs - 1);
      var bx = -0.15 + t * 0.5;
      var k1 = P(bx, side * 0.16), k2 = P(bx - 0.22 + t * 0.1, side * 0.62 * lr), k3 = P(bx - 0.4 + t * 0.16, side * 1.05 * lr);
      M.stroke(ctx, [k1, k2, k3], { w: s * 0.055, w2: s * 0.012, alpha: 0.62, color: col, profile: 'flat', seg: 6, cap: false });
    }
    if (o.hind) {
      // 蚱蜣式的后腿：股节粗、胫节细长，折成一把弓
      var h0 = P(-0.1, -0.12), h1 = P(-0.72, -0.66), h2 = P(-1.25, 0.3);
      M.stroke(ctx, [h0, h1], { w: s * 0.24, w2: s * 0.12, alpha: 0.72, color: col, profile: 'flat', seg: 7 });
      M.stroke(ctx, [h1, h2], { w: s * 0.1, w2: s * 0.02, alpha: 0.7, color: col, profile: 'flat', seg: 7, cap: false });
    }
    // 腹：三四节卵圆一路收过去，节与节之间压出一道缝
    var segs = o.segs == null ? 4 : o.segs;
    for (var i = segs - 1; i >= 0; i--) {
      var u = i / segs;
      ell(-0.34 - i * 0.26, 0, s * (0.3 - i * 0.032), s * (0.24 - i * 0.026), 0.06,
        M.colA(col, 0.62 - u * 0.06), M.hexA(dk, 0.3));
    }
    // 胸：最重的一团，绒毛用短而干的细笔绕一圈
    ell(0.06, 0, s * 0.34, s * 0.28, 0, M.colA(col, 0.78), null);
    if (o.hair) {
      var hn = o.hairN == null ? 14 : o.hairN, hl = o.hairLen == null ? 0.12 : o.hairLen;
      for (var h = 0; h < hn; h++) {
        var ha = rnd(0, 6.28), hp = P(0.06 + Math.cos(ha) * 0.3, Math.sin(ha) * 0.25);
        M.stroke(ctx, [hp, { x: hp.x + Math.cos(ha) * s * hl, y: hp.y + Math.sin(ha) * s * hl }],
          { w: s * 0.03, w2: 0.06, alpha: 0.4, color: dk, profile: 'taper', seg: 4, cap: false });
      }
    }
    if (o.stripes) {
      for (var st = 0; st < 3; st++) {
        var sxp = P(-0.3 - st * 0.26, 0);
        ctx.save();
        ctx.fillStyle = M.colA(dk, 0.85);
        ctx.beginPath();
        ctx.ellipse(sxp.x, sxp.y, s * 0.05, s * (0.24 - st * 0.026), ang, 0, 6.2832);
        ctx.fill();
        ctx.restore();
      }
    }
    // 头 + 眼 + 须
    ell(0.52, 0, s * 0.2, s * 0.19, 0, M.colA(col, 0.85), null);
    var eyeCol = o.eyes || dk, eyeR = o.eyeR == null ? 0.07 : o.eyeR;
    [-1, 1].forEach(function (sgn) {
      var ep = P(0.58, sgn * 0.12);
      M.dot(ctx, ep.x, ep.y, s * eyeR, { color: eyeCol, alpha: 0.9 });
    });
    for (var a = 0; a < 2; a++) {
      var asg = a ? 1 : -1;
      var ab = P(0.62, asg * 0.08);
      var ap = curve(ab.x, ab.y, ang + (dir > 0 ? 0 : Math.PI) + asg * rnd(0.35, 0.7),
        s * rnd(0.6, 0.95), 7, asg * rnd(0.08, 0.2) * dir, 0.03);
      M.stroke(ctx, ap, { w: s * 0.045, w2: s * 0.008, alpha: 0.62, color: col, profile: 'taper', seg: 8, cap: false });
    }
    var wr = o.wingRot == null ? -0.2 : o.wingRot;
    wing(-0.3, -0.12, s * 0.6, s * 0.2, wr, 0.62);
    wing(-0.32, 0.1, s * 0.56, s * 0.19, wr - 0.1, 0.5);
    if (o.wing2) {
      wing(-0.14, -0.26, s * 0.4, s * 0.15, wr + 0.14, 0.42);
      wing(-0.16, 0.24, s * 0.38, s * 0.14, wr, 0.36);
    }
    M.wash(ctx, x, y + s * 0.5, s * 1.1, s * 0.2, { color: INK, alpha: 0.12 });
  }

  /* 人物：袍身是从肩到摆的一整块实体，袖长在肩上，脚从下摆露出来。
     一个椭圆插两根火柴，是所有小人画崩的共同原因 */
  function figure(ctx, x, y, s, o) {
    o = o || {};
    var dir = o.dir || 1, col = o.color || INK;
    var dk = M.darken(col, 0.5);
    var sh = y - s * 0.74, sw = s * 0.2, hw = s * (o.hem || 0.27);
    var hr = s * 0.115, hx = x + dir * s * 0.015, hy = sh - hr * 0.9;
    // 袍身两侧：从肩到下摆渐渐放开，中间略鼓
    var left = [], right = [];
    for (var i = 0; i <= 6; i++) {
      var t = i / 6, ww = sw + (hw - sw) * t * t;
      var yy = sh + (y - sh) * t, bul = Math.sin(t * 3.1416) * s * 0.018;
      left.push({ x: x - ww - bul, y: yy });
      right.push({ x: x + ww + bul, y: yy });
    }
    var outline = left.concat(right.slice().reverse());
    outline.push({ x: x - sw, y: sh });
    var body = M.smooth(outline, 5);
    ctx.save();
    var g = ctx.createLinearGradient(0, sh, 0, y);
    g.addColorStop(0, M.colA(o.robe || '#585247', 0.52));
    g.addColorStop(0.45, M.colA(col, 0.3));
    g.addColorStop(1, M.colA(col, 0.14));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(body[0].x, body[0].y);
    for (var b = 1; b < body.length; b++) ctx.lineTo(body[b].x, body[b].y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // 轮廓只在背光一边落一笔浓墨，勾满一圈就成了剪纸
    M.stroke(ctx, left, { w: s * 0.045, w2: s * 0.022, alpha: 0.7, color: dk, profile: 'flat', seg: 7, cap: false });
    // 衣褶：两三笔从腰往下垂，等距就成梳子
    for (var f = 0; f < rint(2, 3); f++) {
      var fx = x - hw * 0.5 + f * rnd(hw * 0.35, hw * 0.6);
      M.stroke(ctx, [{ x: fx, y: y - s * rnd(0.4, 0.52) }, { x: fx + rnd(-1.5, 1.5), y: y - s * 0.14 },
        { x: fx + rnd(-2.5, 2.5), y: y - s * 0.01 }],
        { w: s * 0.028, w2: s * 0.006, alpha: 0.32, color: dk, profile: 'taper', seg: 7, cap: false });
    }
    // 袖：吊在肩上，袖口收一道深色，手才有个着落
    for (var a = 0; a < 2; a++) {
      var sa = a ? -dir : dir, cw = sw * (a ? 1.15 : 1.5);
      var sp = [{ x: x + sa * sw * 0.6, y: sh + s * 0.02 },
        { x: x + sa * cw, y: sh + s * 0.2 },
        { x: x + sa * cw * 0.92, y: sh + s * (a ? 0.3 : 0.38) }];
      M.stroke(ctx, sp, { w: s * 0.145, w2: s * 0.085, alpha: a ? 0.3 : 0.5, color: col, profile: 'flat', seg: 7, dry: 0.18, cap: false });
      var cu = sp[2];
      M.stroke(ctx, [cu, { x: cu.x + sa * s * 0.03, y: cu.y + s * 0.02 }],
        { w: s * 0.035, w2: s * 0.02, alpha: 0.6, color: dk, profile: 'flat', seg: 4, cap: false });
      M.dot(ctx, cu.x + sa * s * 0.05, cu.y + s * 0.035, s * 0.028, { color: '#e6d9c2', alpha: 0.8 });
    }
    // 交领：两笔在锁骨下交汇，一道亮边一道墨线
    for (var c = 0; c < 2; c++) {
      var cs = c ? 1 : -1;
      var cp = [{ x: x + cs * hr * 0.72, y: sh - hr * 0.1 }, { x: x + cs * hr * 0.18, y: sh + s * 0.05 }, { x: x - cs * hr * 0.5, y: sh + s * 0.11 }];
      M.stroke(ctx, cp, { w: s * 0.03, w2: s * 0.014, alpha: 0.62, color: dk, profile: 'flat', seg: 6, cap: false });
      M.stroke(ctx, nudge(cp, s * 0.028), { w: s * 0.016, w2: s * 0.008, alpha: 0.42, color: '#f6efdd', profile: 'flat', seg: 6, cap: false });
    }
    // 腰带：略往下弯，中间一个结
    var belt = [{ x: x - sw * 1.05, y: y - s * 0.42 }, { x: x, y: y - s * 0.4 }, { x: x + sw * 1.05, y: y - s * 0.42 }];
    M.stroke(ctx, belt, { w: s * 0.032, w2: s * 0.02, alpha: 0.52, color: dk, profile: 'flat', seg: 6, cap: false });
    M.dot(ctx, x, y - s * 0.405, s * 0.022, { color: dk, alpha: 0.7 });
    // 头：一张淡脸，上半压一片发，脑后挽髻
    ctx.save();
    var fg = ctx.createRadialGradient(hx - dir * hr * 0.25, hy - hr * 0.2, hr * 0.12, hx, hy, hr * 1.25);
    fg.addColorStop(0, M.colA('#f7f0de', 0.92));
    fg.addColorStop(0.62, M.colA('#e2d5bc', 0.8));
    fg.addColorStop(1, M.colA('#b9a888', 0.5));
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.ellipse(hx, hy, hr * 0.92, hr, dir > 0 ? 0.06 : -0.06, 0, 6.2832); ctx.fill();
    ctx.clip();
    ctx.fillStyle = M.colA(dk, 0.82);
    ctx.beginPath(); ctx.ellipse(hx - dir * hr * 0.1, hy - hr * 0.72, hr * 1.15, hr * 0.78, 0, 0, 3.1416); ctx.fill();
    ctx.restore();
    // 髻与簪
    M.dot(ctx, hx - dir * hr * 0.15, hy - hr * 1.02, hr * 0.3, { color: dk, alpha: 0.8 });
    M.stroke(ctx, [{ x: hx - dir * hr * 0.7, y: hy - hr * 1.06 }, { x: hx + dir * hr * 0.6, y: hy - hr * 0.88 }],
      { w: hr * 0.1, w2: hr * 0.04, alpha: 0.55, color: '#6b6154', profile: 'taper', seg: 5, cap: false });
    // 五官只点不描：两点眼、一笔嘴
    M.dot(ctx, hx + dir * hr * 0.34, hy + hr * 0.02, hr * 0.08, { color: dk, alpha: 0.8 });
    M.dot(ctx, hx + dir * hr * 0.02, hy + hr * 0.05, hr * 0.07, { color: dk, alpha: 0.6 });
    M.stroke(ctx, [{ x: hx + dir * hr * 0.05, y: hy + hr * 0.46 }, { x: hx + dir * hr * 0.4, y: hy + hr * 0.42 }],
      { w: hr * 0.11, w2: hr * 0.03, alpha: 0.5, color: dk, profile: 'taper', seg: 4, cap: false });
    // 颈与脚：下摆前露两只脚尖
    M.stroke(ctx, [{ x: hx, y: hy + hr * 0.85 }, { x: x, y: sh + s * 0.01 }],
      { w: hr * 0.5, w2: hr * 0.44, alpha: 0.5, color: '#d8c9ad', profile: 'flat', seg: 5, cap: false });
    for (var q = 0; q < 2; q++) {
      var qx = x + (q ? 1 : -1) * hw * rnd(0.25, 0.5);
      M.stroke(ctx, [{ x: qx - dir * s * 0.05, y: y + 0.4 }, { x: qx + dir * s * 0.06, y: y + 0.6 }],
        { w: s * 0.05, w2: s * 0.03, alpha: q ? 0.42 : 0.6, color: dk, profile: 'flat', seg: 5, cap: false });
    }
  }

  var MOTIFS = {

    /* ———— 花木 ———— */
    plum: function (ctx) {
      var dir = chance(0.5) ? 1 : -1;
      var x0 = dir > 0 ? rnd(-2, 8) : rnd(92, 102);
      var y0 = rnd(60, 86);
      // 主枝：从角上斜出，一路弧形向上，细而有节
      var main = curve(x0, y0, dir > 0 ? -0.5 : -2.64, rnd(56, 74), 6, dir > 0 ? -0.14 : 0.14, 0.13);
      limb(ctx, main, { w: 5.2, w2: 1.1, alpha: 0.74, dry: 0.5, washAlpha: 0.06 });
      var nodes = main.slice(2);
      var twigs = [];
      for (var t = 0; t < rint(3, 5); t++) {
        var np = nodes[rint(0, nodes.length - 1)];
        var ang = (dir > 0 ? -1.15 : -1.99) + rnd(-0.85, 0.85);
        var tw = curve(np.x, np.y, ang, rnd(13, 22), 5, rnd(0.18, 0.36) * (ang > -1.57 ? 1 : -1), 0.12);
        limb(ctx, tw, { w: 2.2, w2: 0.55, alpha: 0.74, dry: 0.35, joints: false, washAlpha: 0.06 });
        twigs.push(tw);
        if (chance(0.7)) {
          var lp = tw[Math.max(1, tw.length - 2)];
          var s = curve(lp.x, lp.y, ang + rnd(-1.1, 1.1), rnd(7, 12), 4, rnd(-0.3, 0.3), 0.18);
          M.stroke(ctx, s, { w: 1.1, w2: 0.24, alpha: 0.72, profile: 'taper', seg: 8, dry: 0.35 });
          twigs.push(s);
        }
      }
      // 干上点苔
      for (var m = 0; m < rint(4, 8); m++) {
        var mp = main[rint(1, main.length - 2)];
        M.moss(ctx, mp.x + rnd(-1.5, 1.5), mp.y + rnd(-2, 2), rint(2, 3), { spread: 1.6, min: 0.25, max: 0.6 });
      }
      // 花只开在节上与梢头，且彼此留出间距，别开成一串葡萄
      var cand = [];
      nodes.forEach(function (p) { if (chance(0.85)) cand.push({ x: p.x + rnd(-2, 2), y: p.y + rnd(-2, 2) }); });
      twigs.forEach(function (tw) {
        cand.push({ x: tw[tw.length - 1].x, y: tw[tw.length - 1].y });
        if (chance(0.55)) cand.push({ x: tw[tw.length - 2].x + rnd(-1.5, 1.5), y: tw[tw.length - 2].y + rnd(-1.5, 1.5) });
      });
      cand = cand.filter(function (p) { return p.x > 3 && p.x < 97 && p.y > 4 && p.y < 90; });
      var spots = [];
      cand.forEach(function (p) {
        for (var s2 = 0; s2 < spots.length; s2++) {
          if (Math.hypot(p.x - spots[s2].x, p.y - spots[s2].y) < 8.5) return;
        }
        if (spots.length < 12) spots.push(p);
      });
      spots.forEach(function (p, idx) {
        var r = rnd(3.6, 6);
        if (idx % 5 === 4) {
          M.dot(ctx, p.x, p.y, r * 0.4, { color: RED, alpha: 0.9 });
          M.dot(ctx, p.x, p.y + r * 0.36, r * 0.13, { color: '#6d211f', alpha: 0.8 });
        } else {
          fiveFlower(ctx, p.x, p.y, r, RED, rnd(0.78, 0.98));
        }
      });
      M.splatter(ctx, main[3].x, main[3].y, 15, 10, { color: RED, alpha: 0.32, max: 1 });
      M.wash(ctx, main[4].x, main[4].y, 26, 18, { color: RED, alpha: 0.06 });
      for (var f = 0; f < rint(1, 4); f++) {
        M.petal(ctx, rnd(24, 84), rnd(70, 96), rnd(1.4, 2.4), rnd(0.9, 1.5), rnd(0, 3.14), { color: RED, alpha: rnd(0.25, 0.45), edge: false });
      }
    },

    peach: function (ctx) {
      var dir = chance(0.5) ? 1 : -1;
      var x0 = dir > 0 ? rnd(-10, 0) : rnd(100, 110);
      var y0 = rnd(64, 86);
      var main = curve(x0, y0 + rnd(6, 16), dir > 0 ? -0.42 : -2.72, rnd(66, 88), 6, dir > 0 ? -0.09 : 0.09, 0.12);
      // 桃干要一路收细，通体一样粗就成了铁棍
      limb(ctx, main, { w: 4.8, w2: 0.9, alpha: 0.62, dry: 0.45, edgeAlpha: 0.24 });
      var nodes = main.slice(2), twigs = [];
      for (var t = 0; t < rint(3, 5); t++) {
        var np = nodes[rint(0, nodes.length - 1)];
        var ang = (dir > 0 ? -1.1 : -2.05) + rnd(-0.9, 0.9);
        var tw = curve(np.x, np.y, ang, rnd(13, 24), 4, rnd(-0.14, 0.14), 0.16);
        limb(ctx, tw, { w: 1.8, w2: 0.4, alpha: 0.56, dry: 0.35, joints: false, edgeAlpha: 0.2 });
        twigs.push(tw);
      }
      var all = nodes.concat(twigs.reduce(function (a, t) { return a.concat(t); }, []));
      // 花团锦簇：成团地开，不是均匀撒
      for (var c = 0; c < rint(7, 11); c++) {
        var base = all[rint(0, all.length - 1)];
        var cx = base.x + rnd(-5, 5), cy = base.y + rnd(-5, 5);
        var cnt = rint(2, 5);
        for (var k = 0; k < cnt; k++) {
          var r = rnd(2.8, 4.6);
          if (chance(0.22)) {
            M.dot(ctx, cx + rnd(-4, 4), cy + rnd(-4, 4), r * 0.42, { color: '#d9768a', alpha: rnd(0.7, 0.95) });
          } else {
            fiveFlower(ctx, cx + rnd(-4, 4), cy + rnd(-4, 4), r, '#e293a6', rnd(0.62, 0.9), '#b4526a');
          }
        }
      }
      // 新叶两三片，粉里透一点绿
      for (var l = 0; l < rint(2, 5); l++) {
        var lp = all[rint(1, all.length - 1)];
        M.blade(ctx, lp.x, lp.y, lp.x + rnd(-8, 8), lp.y + rnd(4, 12), rnd(1.4, 2.4), { color: GREEN, alpha: rnd(0.3, 0.55) });
      }
      M.splatter(ctx, main[3].x, main[3].y, 20, 12, { color: '#e293a6', alpha: 0.3, max: 1.1 });
      M.wash(ctx, 50 + dir * 12, 34, 32, 22, { color: '#e293a6', alpha: 0.08 });
      // 花落一路
      for (var f = 0; f < rint(3, 7); f++) {
        M.petal(ctx, rnd(10, 92), rnd(56, 96), rnd(1.4, 2.6), rnd(0.9, 1.7), rnd(0, 3.14), { color: '#e293a6', alpha: rnd(0.22, 0.45), edge: false });
      }
    },

    lotus: function (ctx) {
      var water = rnd(78, 86);
      // 水面：淡墨横晕 + 断续的浅波，不画通长直线
      M.wash(ctx, rnd(40, 60), water + 5, 48, 7, { color: INK, alpha: 0.05 });
      waterLines(ctx, water + 2, rint(4, 6), rnd(2.6, 4), { color: '#6d8ba0' });

      // 一茎一物：浮叶贴水、立叶出水、花最高，四个横位各占一个
      var step = rnd(19, 25), x0 = rnd(6, 12);
      var xs = [];
      for (var i = 0; i < 4; i++) xs.push(clamp(x0 + i * step + rnd(-3, 3), 6, 94));
      if (chance(0.5)) xs.reverse();

      // 立叶两片：先淡远、后浓近，一大一小、前后相叠
      for (var l = 0; l < 2; l++) {
        var near = l === 1;
        var c = xs[near ? 1 : 0];
        var lr = near ? rnd(17, 24) : rnd(11, 16);
        var flatv = rnd(0.6, 0.82);
        var ly = water - (near ? rnd(20, 32) : rnd(8, 20));
        var bend = rnd(-11, 11);
        var topX = c + bend * 0.35;
        // 梗：出水一段微弯，一路顶到盘面中心，叶盖在梗头上——插在叶底就是伞
        M.stroke(ctx, [{ x: c, y: water + 3 }, { x: c + bend * 0.6, y: (water + ly) / 2 }, { x: topX, y: ly }],
          { w: near ? 2.6 : 1.8, w2: 1, alpha: near ? 0.66 : 0.34, color: '#3a4a36', profile: 'taper', seg: 11, dry: 0.42 });
        for (var t = 0; t < rint(3, 7); t++) {
          var tf = rnd(0.2, 0.95), mt = 1 - tf;
          var qx = mt * mt * c + 2 * mt * tf * (c + bend * 0.6) + tf * tf * topX;
          var qy = mt * mt * (water + 3) + 2 * mt * tf * ((water + ly) / 2) + tf * tf * ly;
          M.dot(ctx, qx + rnd(-0.8, 0.8), qy, 0.32, { color: '#3d4c36', alpha: 0.45 });
        }
        lotusLeaf(ctx, topX, ly, lr, {
          color: near ? '#2c3d33' : '#4a5c4e', alpha: near ? rnd(0.56, 0.68) : rnd(0.26, 0.38),
          flat: flatv, notch: rnd(-2.3, -0.85)
        });
        // 叶在水里的倒影
        M.wash(ctx, topX, water + rnd(2, 5), lr * 0.85, 3, { color: '#2f4038', alpha: near ? 0.18 : 0.1 });
      }
      // 浮叶贴水，摆在花的对面，别和花叠在一起
      var fx = xs[3], fy = water - rnd(34, 48);
      var flx = clamp(fx + (fx > 50 ? -1 : 1) * rnd(26, 40), 6, 94), fly = water + rnd(0, 3);
      lotusLeaf(ctx, flx, fly, rnd(9, 13), { color: '#4a5c4e', alpha: 0.3, flat: rnd(0.5, 0.68), notch: rnd(0, 6.28) });
      // 花梗：最高的一茎，一路有节
      var fb = rnd(-9, 9);
      M.stroke(ctx, [{ x: fx - fb * 0.2, y: water + 2 }, { x: fx - fb * 0.55, y: (water + fy) / 2 }, { x: fx, y: fy + 6 }],
        { w: 1.8, w2: 0.85, alpha: 0.66, color: '#42503a', profile: 'taper', seg: 11, dry: 0.35 });
      lotusFlower(ctx, fx, fy, rnd(13, 17));
      M.wash(ctx, fx, water + 3, 16, 3, { color: '#c9748c', alpha: 0.1 });

      // 一支花苞或莲蓬，斜斜地探出去
      if (chance(0.8)) {
        var px = xs[2] + rnd(-3, 3), py = water - rnd(12, 26);
        var pb = rnd(-6, 6);
        M.stroke(ctx, [{ x: px, y: water + 2 }, { x: px + pb * 0.5, y: (water + py) / 2 }, { x: px + pb * 0.2, y: py + 4 }],
          { w: 1.5, w2: 0.75, alpha: 0.6, color: '#3f4c34', profile: 'taper', seg: 9, dry: 0.3 });
        if (chance(0.45)) {
          // 莲蓬：侧看是个小碗，碗里几粒莲子
          var pxx = px + pb * 0.2;
          ctx.save();
          ctx.fillStyle = '#6d7b46';
          ctx.beginPath();
          ctx.ellipse(pxx, py, 4.4, 2.6, rnd(-0.3, 0.3), 0, 6.2832);
          ctx.fill();
          ctx.strokeStyle = M.hexA('#3a4526', 0.7);
          ctx.lineWidth = 0.4;
          ctx.stroke();
          ctx.restore();
          for (var d = 0; d < 4; d++) M.dot(ctx, pxx + rnd(-2.6, 2.6), py + rnd(-1, 1), 0.7, { color: '#33402a', alpha: 0.75 });
        } else {
          // 花苞：两三层瓣合着，尖上最红
          var tipY = py - 8;
          lotusPetal(ctx, px + pb * 0.2, py + 3, -Math.PI / 2 - 0.34, 12, 5.4, { alpha: 0.72, color: '#eaa0b2', tip: '#b8476d' });
          lotusPetal(ctx, px + pb * 0.2, py + 3, -Math.PI / 2 + 0.3, 12.5, 5.6, { alpha: 0.74, color: '#e795ab', tip: '#bb4a72' });
          lotusPetal(ctx, px + pb * 0.2, py + 2, -Math.PI / 2 - 0.02, 13.5, 4.6, { alpha: 0.85, color: '#f2b6c4', tip: '#c85f80' });
          M.wash(ctx, px + pb * 0.2, tipY + 4, 6, 8, { color: '#c2557a', alpha: 0.12 });
        }
      }
      // 水里的墨晕
      M.wash(ctx, fx + rnd(-10, 10), water + 5, 24, 6, { color: BLUE, alpha: 0.06 });
    },

    bamboo: function (ctx) {
      // 一竿：分节画，节只做两道细横——粗黑的一顿就成了竹梯
      function culm(ctx, bx, lean, top, wBase, alpha) {
        var segs = [], y = 99;
        while (y > top) {
          var h = rnd(10, 16) * (0.62 + 0.38 * (y / 99));
          var t0 = (99 - y) / 100, t1 = (99 - (y - h)) / 100;
          segs.push({ x0: bx + lean * t0, y0: y, x1: bx + lean * t1, y1: y - h });
          y -= h;
        }
        segs.forEach(function (sg) {
          M.stroke(ctx, [{ x: sg.x0, y: sg.y0 },
            { x: (sg.x0 + sg.x1) / 2 + rnd(-0.5, 0.5), y: (sg.y0 + sg.y1) / 2 },
            { x: sg.x1, y: sg.y1 }],
            { w: wBase, w2: wBase * 0.92, alpha: alpha, color: INK, profile: 'flat', seg: 4, dry: 0.3 });
          // 受光一侧留一道白
          M.stroke(ctx, [{ x: sg.x0 - wBase * 0.26, y: sg.y0 }, { x: sg.x1 - wBase * 0.26, y: sg.y1 }],
            { w: wBase * 0.3, w2: wBase * 0.26, alpha: 0.1, color: '#f4efe0', profile: 'flat', seg: 3 });
          ctx.save();
          ctx.strokeStyle = M.hexA(M.darken(INK, 0.6), alpha * 0.85);
          ctx.lineWidth = Math.max(0.22, wBase * 0.13);
          for (var k = 0; k < 2; k++) {
            ctx.beginPath();
            ctx.moveTo(sg.x1 - wBase * 0.6, sg.y1 + 0.4 + k * 0.85);
            ctx.quadraticCurveTo(sg.x1, sg.y1 - 0.5 + k * 0.85, sg.x1 + wBase * 0.6, sg.y1 + 0.4 + k * 0.85);
            ctx.stroke();
          }
          ctx.restore();
        });
        return segs;
      }
      // 一枝：两三个叶组，每组三五撇，角度拉开、长短参差——挤在一起就是一把扫帚
      function branch(ctx, x, y, ang, s, alpha) {
        var d = ang + Math.PI / 2 > 0 ? 1 : -1;
        var tw = curve(x, y, ang, rnd(11, 21), 5, d * rnd(0.06, 0.14), 0.1);
        M.stroke(ctx, tw, { w: 0.85, w2: 0.28, alpha: alpha, profile: 'taper', seg: 7, dry: 0.45 });
        var tp = M.smooth(tw, 8);
        var groups = rint(2, 3);
        for (var g = 0; g < groups; g++) {
          var gi = Math.round(2 + (tp.length - 3) * (g / (groups - 1 || 1)));
          gi = clamp(gi, 2, tp.length - 1);
          var base = Math.atan2(tp[gi].y - tp[gi - 1].y, tp[gi].x - tp[gi - 1].x);
          var cnt = rint(3, 5);
          var ca = clamp(base + 0.4, 0.35, 2.3);        // 竹叶一律朝外朝下，往上戳就成了羽毛
          var span = rnd(0.95, 1.5);
          var lo = Math.max(0.12, ca - span / 2), hi = Math.min(2.62, ca + span / 2);
          for (var q = 0; q < cnt; q++) {
            var t = cnt === 1 ? 0.5 : q / (cnt - 1);
            var a = lo + (hi - lo) * t + rnd(-0.07, 0.07);
            var len = s * (0.62 + Math.abs(t - 0.5) * 0.5 + rnd(0.16, 0.62));
            taperLeaf(ctx, tp[gi].x + rnd(-0.8, 0.8), tp[gi].y + rnd(-0.5, 0.8), a, len, len * rnd(0.13, 0.19), {
              color: INK, alpha: alpha * rnd(0.5, 0.9), bend: rnd(0.1, 0.3)
            });
          }
        }
      }
      var n = rint(2, 3), bs = [];
      for (var i = 0; i < n; i++) bs.push(clamp(12 + i * rnd(16, 26) + rnd(-4, 4), 8, 84));
      bs.forEach(function (bx, i) {
        var near = i === n - 1;
        var alpha = near ? rnd(0.56, 0.74) : rnd(0.26, 0.42);
        var wBase = near ? rnd(2.6, 3.8) : rnd(1.8, 2.6);
        var segs = culm(ctx, bx, rnd(-7, 10), rnd(6, 20), wBase, alpha);
        for (var c = 0; c < rint(2, 4); c++) {
          var sg = segs[rint(Math.floor(segs.length * 0.2), segs.length - 2)];
          var ang = -Math.PI / 2 + (chance(0.5) ? 1 : -1) * rnd(0.5, 1.1);
          branch(ctx, sg.x1, sg.y1, ang, near ? rnd(11, 16) : rnd(8, 12), alpha);
        }
      });
      // 梢头一组浓叶压住画面上缘
      if (chance(0.7)) branch(ctx, rnd(30, 70), rnd(8, 20), rnd(-2.6, -0.5), rnd(13, 19), rnd(0.66, 0.86));
      M.wash(ctx, 50, 92, 42, 7, { color: INK, alpha: 0.07 });
    },

    pine: function (ctx) {
      var dir = chance(0.6) ? 1 : -1;
      var bx = rnd(26, 68), top = rnd(8, 18);
      // 干：斜着长，一路有节，粗细分明——一根直杠撑不起松树
      var trunk = curve(bx, 102, -Math.PI / 2 + dir * rnd(0.1, 0.32), 102 - top, 10, dir * rnd(-0.02, 0.05), 0.15);
      limb(ctx, trunk, { w: 6.4, w2: 2.2, alpha: 0.66, dry: 0.62, washAlpha: 0.08, edgeAlpha: 0.4 });
      var tp = M.smooth(trunk, 14);
      // 鳞甲：顺干向的短撇，左右交替——一层层横弧就成了竹节
      for (var k = 0; k < rint(16, 26); k++) {
        var ki = rint(1, tp.length - 3), p = tp[ki];
        var ta = Math.atan2(tp[ki + 1].y - tp[ki - 1].y, tp[ki + 1].x - tp[ki - 1].x);
        var side = chance(0.5) ? 1 : -1;
        var off = rnd(0.5, 2.8) * side;
        var px = p.x + Math.cos(ta + Math.PI / 2) * off, py = p.y + Math.sin(ta + Math.PI / 2) * off;
        var L = rnd(2.4, 6);
        ctx.save();
        ctx.strokeStyle = M.hexA(M.darken(INK, 0.62), rnd(0.24, 0.48));
        ctx.lineWidth = rnd(0.4, 0.9);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + Math.cos(ta) * L * 0.5 + side * 0.8, py + Math.sin(ta) * L * 0.5,
          px + Math.cos(ta) * L, py + Math.sin(ta) * L);
        ctx.stroke();
        ctx.restore();
      }
      // 下半段一两道短横裂，比干窄——通宽的横弧就成了竹节
      for (var h = 0; h < rint(1, 3); h++) {
        var hi = rint(Math.round(tp.length * 0.66), tp.length - 2), hp = tp[hi];
        var hw = rnd(1.2, 2.6);
        ctx.save();
        ctx.strokeStyle = M.hexA(M.darken(INK, 0.5), rnd(0.28, 0.46));
        ctx.lineWidth = rnd(0.45, 0.8);
        ctx.beginPath();
        ctx.moveTo(hp.x - hw, hp.y + rnd(-0.6, 0.6));
        ctx.quadraticCurveTo(hp.x, hp.y + rnd(0.8, 2), hp.x + hw, hp.y + rnd(-0.6, 0.6));
        ctx.stroke();
        ctx.restore();
      }
      // 枝：从上半段横出，先扬后垂，梢头一团针叶
      var crowns = [];
      for (var i = 0; i < rint(3, 5); i++) {
        var a0 = tp[rint(Math.round(tp.length * 0.32), tp.length - 2)];
        var side = (i % 2 === 0 ? dir : -dir) || 1;
        var ang = -Math.PI / 2 + side * rnd(0.85, 1.35);
        var arm = curve(a0.x, a0.y, ang, rnd(18, 34), 6, side * rnd(0.14, 0.26), 0.1);
        limb(ctx, arm, { w: rnd(1.8, 2.8), w2: rnd(0.6, 1), alpha: 0.58, seg: 8, joints: false, dry: 0.55, washAlpha: 0.05, edgeAlpha: 0.3 });
        var ap = M.smooth(arm, 10);
        crowns.push({ x: ap[ap.length - 1].x, y: ap[ap.length - 1].y, s: rnd(9, 15), a: rnd(0.5, 0.7) });
        if (chance(0.6)) {
          var mid = ap[rint(3, ap.length - 3)];
          crowns.push({ x: mid.x, y: mid.y, s: rnd(7, 11), a: rnd(0.4, 0.6) });
        }
      }
      crowns.push({ x: tp[tp.length - 1].x + rnd(-3, 3), y: tp[tp.length - 1].y, s: rnd(10, 15), a: 0.72 });
      crowns.forEach(function (c) { needleFan(ctx, c.x, c.y, c.s, c.a); });
      // 树脚：一坡土把干顶住——凭空一块圆墨是泼翻了不是石头
      var gx = bx + rnd(-3, 3);
      M.wash(ctx, gx, 96, rnd(15, 23), rnd(4, 6.5), { color: INK, alpha: 0.13 });
      for (var r0 = 0; r0 < rint(3, 6); r0++) {
        M.stroke(ctx, [{ x: gx + rnd(-13, 13), y: 94 + rnd(0, 3) }, { x: gx + rnd(-13, 13), y: 96 + rnd(0, 2.5) }],
          { w: rnd(0.6, 1.5), w2: 0.2, alpha: rnd(0.18, 0.36), profile: 'taper', seg: 4, cap: false });
      }
      M.moss(ctx, gx + rnd(-8, 8), 93, rint(2, 4), { spread: 3, min: 0.3, max: 0.7, alpha: 0.5 });
    },

    willow: function (ctx) {
      var drift = rnd(0.1, 0.4) * (chance(0.72) ? 1 : -1);
      var tx = rnd(14, 34), wy = rnd(88, 95);
      // 干：从左下起，一路向上出画；瘦而斜，灰而不黑，枯笔打散才不像竹竿
      var trunk = curve(tx, 99, -Math.PI / 2 + rnd(-0.3, 0.16), 64, 9, rnd(-0.04, 0.06), 0.16);
      limb(ctx, trunk, { w: 6.4, w2: 1.7, color: '#6e675a', joints: false, dry: 0.66, alpha: 0.56, washAlpha: 0.08, edgeAlpha: 0.14 });
      var tp = M.smooth(trunk, 12);
      // 树脚：干底两笔撇开，插进土里才站得住
      for (var rf = 0; rf < 2; rf++) {
        var rp = tp[Math.round(tp.length * (0.02 + rf * 0.03))];
        M.stroke(ctx, [rp, { x: rp.x + (rf ? 5 : -6) + rnd(-1, 1), y: 99 }],
          { w: 3.2, w2: 0.6, alpha: 0.4, color: '#6e675a', profile: 'taper', seg: 6, dry: 0.5, cap: false });
      }
      // 树皮：短而干的纵纹，密一些才盖住那两道平边
      for (var k = 0; k < rint(13, 19); k++) {
        var i0 = rint(1, tp.length - 4), p = tp[i0];
        M.stroke(ctx, [p, { x: p.x + rnd(-2.6, 2.6), y: p.y + rnd(3, 11) }],
          { w: rnd(0.4, 0.9), w2: 0.2, alpha: rnd(0.22, 0.46), color: M.darken(INK, 0.55), profile: 'taper', dry: 0.85, seg: 5 });
      }
      for (var sc = 0; sc < rint(2, 4); sc++) {
        var sp0 = tp[rint(2, tp.length - 6)];
        M.blot(ctx, sp0.x + rnd(-2, 2), sp0.y, rnd(0.9, 1.8), { alpha: 0.3, lobes: 4 });
      }
      // 枝：从干的上半段横出，扬出去就垂下来；只用淡细笔，加浓边就成了镰刀
      var limbs = [];
      for (var i = 0; i < rint(4, 6); i++) {
        var ang = rnd(-2.85, -0.4);
        var a0 = tp[rint(Math.round(tp.length * 0.5), tp.length - 2)];
        var sgn = ang + Math.PI / 2 > 0 ? 1 : -1;
        var arm = curve(a0.x, a0.y, ang, rnd(20, 36), 6, sgn * rnd(0.07, 0.14), 0.16);
        limbs.push(arm);
        M.stroke(ctx, arm, { w: rnd(0.9, 1.4), w2: 0.12, alpha: rnd(0.18, 0.3), color: '#6b6559', profile: 'taper', seg: 11, dry: 0.7 });
      }

      // 丝条：条子是骨架，淡到几乎看不见；成不成帘子全看叶
      function strand(sx, sy, len, splay) {
        var pts = [{ x: sx, y: sy }];
        var px = sx, py = sy, ang = Math.PI / 2 + splay + rnd(-0.1, 0.1);
        var steps = Math.max(10, Math.round(len / 4.5));
        var sway = rnd(0, 6.28), sw2 = rnd(0.02, 0.05);
        for (var n = 0; n < steps; n++) {
          var tt = n / steps;
          // 上段近乎垂直、下段被风带走；全程一个方向就成了一排栅栏
          ang += drift * 0.05 * (0.3 + tt * 2.2) + Math.sin(tt * 3.4 + sway) * sw2 + rnd(-0.015, 0.015);
          ang = clamp(ang, Math.PI * 0.34, Math.PI * 0.68);
          px += Math.cos(ang) * len / steps;
          py += Math.sin(ang) * len / steps;
          pts.push({ x: px, y: py });
        }
        M.stroke(ctx, pts, {
          w: rnd(0.26, 0.44), w2: 0.08, alpha: rnd(0.1, 0.19),
          color: chance(0.35) ? '#5d6a4a' : INK, profile: 'taper', seg: 15, dry: 0.4
        });
        // 叶：贴着条子顺下去，上密下疏；条子中空的帘子就是一把梳子
        var sp = M.smooth(pts, 6);
        for (var l = 2; l < sp.length - 1; l++) {
          if (chance(0.28 + 0.5 * (l / sp.length))) continue;
          var q = sp[l - 2];
          var base = Math.atan2(sp[l].y - q.y, sp[l].x - q.x);
          var side = chance(0.5) ? 1 : -1;
          var aa = base + side * rnd(0.16, 0.5);
          var ll = rnd(2, 3.6) * (1 - 0.34 * (l / sp.length));
          M.blade(ctx, sp[l].x, sp[l].y, sp[l].x + Math.cos(aa) * ll, sp[l].y + Math.sin(aa) * ll,
            rnd(0.26, 0.44), { color: chance(0.3) ? '#67794f' : GREEN, alpha: rnd(0.22, 0.42), bulge: rnd(0.85, 1.05) });
          if (chance(0.2)) {
            var aa2 = base + side * rnd(0.5, 1.0);
            var l2 = rnd(1.4, 2.4);
            M.blade(ctx, sp[l].x, sp[l].y, sp[l].x + Math.cos(aa2) * l2, sp[l].y + Math.sin(aa2) * l2,
              rnd(0.2, 0.32), { color: GREEN, alpha: rnd(0.14, 0.26), bulge: rnd(0.85, 1.05) });
          }
        }
      }

      // 帘子：枝上垂六七缕，干顶再垂四五缕，长短由它到水面的距离定
      var hang = [];
      limbs.forEach(function (arm) {
        var ap = M.smooth(arm, 12);
        var cnt = rint(3, 5);
        for (var j = 0; j < cnt; j++) {
          var t = 0.2 + 0.8 * (cnt > 1 ? j / (cnt - 1) : rnd(0.25, 0.95)) + rnd(-0.12, 0.12);
          var o = ap[clamp(Math.round(t * (ap.length - 1)), 0, ap.length - 1)];
          if (o) hang.push({ x: o.x, y: o.y, out: (o.x - tx) * 0.008 });
        }
      });
      for (var z = 0; z < rint(4, 6); z++) {
        var zp = tp[rint(Math.round(tp.length * 0.7), tp.length - 1)];
        hang.push({ x: zp.x + rnd(-3, 3), y: zp.y, out: rnd(-0.08, 0.08) });
      }
      // 冠内再补一把短条，帘子才有里外，不是一排挂下来的线
      for (var z2 = 0; z2 < rint(6, 10); z2++) {
        var zq = tp[rint(Math.round(tp.length * 0.62), tp.length - 1)];
        strand(zq.x + rnd(-9, 9), zq.y + rnd(-2, 6), rnd(7, 22), rnd(-0.14, 0.14));
      }
      hang.forEach(function (h) {
        // 长短一定要散开：齐着水面剪平就成了渔网
        strand(h.x, h.y, Math.min(rnd(20, 66), Math.max(12, (wy - h.y) * rnd(0.5, 1.02))), h.out);
      });
      // 两三缕特别长的拂到水上，另有一两片飘落的柳叶
      for (var fl = 0; fl < rint(2, 4); fl++) {
        M.blade(ctx, rnd(30, 92), rnd(40, 84), rnd(30, 92) + rnd(-4, 4), rnd(40, 84) + rnd(3, 7),
          rnd(0.3, 0.5), { color: chance(0.5) ? GREEN : '#8a7a3c', alpha: rnd(0.2, 0.36), bulge: 1 });
      }

      // 岸：断断续续的几段，不通长一划
      for (var b = 0; b < rint(3, 5); b++) {
        var bx = rnd(2, 70), bw = rnd(12, 30);
        M.stroke(ctx, [{ x: bx, y: wy + rnd(-1, 1) }, { x: bx + bw * 0.5, y: wy + rnd(-1.5, 0.5) }, { x: bx + bw, y: wy + rnd(-1, 1) }],
          { w: 0.8, w2: 0.2, alpha: rnd(0.09, 0.17), profile: 'taper', seg: 8, dry: 0.62 });
      }
      waterLines(ctx, wy + 2, rint(2, 4), rnd(2.4, 3.6), { color: '#6d8ba0' });
      // 梢尖点水：一个小涡而不是整圈椭圆
      if (chance(0.7)) {
        var rx = rnd(38, 92), ry = wy + rnd(0.5, 3);
        ctx.save();
        ctx.globalAlpha = rnd(0.18, 0.28);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(rx, ry, rnd(2.5, 5), rnd(0.8, 1.6), 0, rnd(0.2, 1.2), rnd(3.6, 5.4));
        ctx.stroke();
        ctx.restore();
      }
      M.moss(ctx, tx + rnd(-3, 3), wy - 1, rint(2, 4), { spread: 3, min: 0.3, max: 0.7, alpha: 0.5 });
      M.wash(ctx, rnd(30, 70), wy - rnd(10, 20), 40, 5, { color: INK, alpha: 0.035 });
    },

    orchid: function (ctx) {
      var x = rnd(34, 60), y = rnd(82, 93);
      // 兰叶：立叶长而直、斜叶短而翻，根部错开、画的顺序交错，才互相破开不成扇形
      var plan = [];
      var n = rint(6, 9);
      for (var i = 0; i < n; i++) {
        var t = n === 1 ? 0.5 : i / (n - 1);
        var a = -Math.PI / 2 + (t - 0.5) * rnd(1.55, 2.15) + rnd(-0.16, 0.16);
        var up = Math.abs(a + Math.PI / 2) < 0.55;
        plan.push({ a: a, up: up, len: up ? rnd(44, 68) : Math.max(20, rnd(30, 54) - Math.abs(a + Math.PI / 2) * 8) });
      }
      plan.push({ a: -Math.PI / 2 + (chance(0.5) ? 1 : -1) * rnd(1.3, 1.6), up: false, len: rnd(15, 23) });
      for (var sh = plan.length - 1; sh > 0; sh--) {   // 洗牌：按顺序画就是一把折扇
        var j = Math.floor(rnd(0, sh + 1)), tmp = plan[sh];
        plan[sh] = plan[j]; plan[j] = tmp;
      }
      plan.forEach(function (L) {
        var outward = L.a + Math.PI / 2 > 0 ? 1 : -1;
        var pts = curve(x + rnd(-5, 5), y - rnd(0, 2.5), L.a, L.len, 11,
          outward * (L.up ? rnd(0.02, 0.1) : rnd(0.13, 0.27)), 0.05);
        M.stroke(ctx, pts, {
          w: rnd(2.2, 3.8), w2: 0.12, alpha: rnd(0.4, 0.8), color: INK,
          profile: 'taper', seg: 16, dry: 0.35
        });
      });
      // 花莛：一枝从叶间斜出，扬出去，梢上开两三朵
      var sd = chance(0.6) ? 1 : -1;
      var scape = curve(x + rnd(-3, 3), y - rnd(2, 9), -Math.PI / 2 + sd * rnd(0.15, 0.5), rnd(40, 58), 9, sd * rnd(0.04, 0.11), 0.05);
      M.stroke(ctx, scape, { w: 1.2, w2: 0.28, alpha: 0.58, profile: 'taper', seg: 11, dry: 0.3 });
      var sp = M.smooth(scape, 12);
      for (var f = 0; f < rint(2, 4); f++) {
        var p = sp[clamp(Math.round(sp.length * (0.42 + f * 0.18)), 1, sp.length - 1)];
        orchidFlower(ctx, p.x, p.y, rnd(5.5, 7.6), rnd(-1.1, 1.1));
      }
      // 未放的一苞
      if (chance(0.7)) {
        var bp = sp[sp.length - 1];
        taperLeaf(ctx, bp.x, bp.y, -Math.PI / 2 + rnd(-0.5, 0.5), rnd(5, 8), 1.4, { color: INK, alpha: 0.55, bend: 0.16 });
      }
      // 根头一丛苔点，把叶收住
      M.moss(ctx, x + rnd(-4, 4), y + rnd(0, 2), rint(2, 4), { spread: 2.6, min: 0.3, max: 0.7, alpha: 0.55 });
    },

    mum: function (ctx) {
      var x = rnd(34, 62), y = rnd(26, 44), r = rnd(15, 22);
      var pal = ['#d9b45c', '#c9973a', '#e0c477', '#bb7d3c'];
      var swirl = chance(0.5) ? 1 : -1;
      M.wash(ctx, x, y, r * 1.2, r * 1.1, { color: GOLD, alpha: 0.12 });
      // 瓣：从外圈往里圈画，瓣根落在越来越小的圆周上——全从一点射出去是烟花不是菊
      var rings = rint(5, 7);
      for (var g = rings - 1; g >= 0; g--) {
        var t = rings > 1 ? g / (rings - 1) : 0;         // 1=最外圈
        var cnt = Math.round(10 + t * 16);
        var rr = r * (0.34 + t * 0.66);
        var root = rr * (0.16 + t * 0.2);
        var a0 = rnd(0, 6.28);
        for (var i = 0; i < cnt; i++) {
          var a = a0 + i / cnt * 6.2832 + rnd(-0.06, 0.06);
          var rx = x + Math.cos(a) * root, ry = y + Math.sin(a) * root * 0.8;
          var len = rr * rnd(0.6, 0.9);
          var droop = 0.34 + Math.max(0, Math.sin(a)) * 0.5;   // 下半圈往下垂
          taperLeaf(ctx, rx, ry, a + rnd(-0.12, 0.12), len, len * rnd(0.2, 0.3), {
            color: chance(0.1) ? INK : pal[rint(0, pal.length - 1)],
            alpha: rnd(0.5, 0.88) * (0.72 + t * 0.28),
            bend: swirl * (0.1 + t * 0.26) + droop * 0.3
          });
        }
      }
      // 花心：一小圈短瓣围着，中间一顿深
      for (var c = 0; c < rint(8, 13); c++) {
        var ca = rnd(0, 6.28);
        taperLeaf(ctx, x + Math.cos(ca) * r * 0.05, y + Math.sin(ca) * r * 0.04, ca, r * rnd(0.16, 0.3),
          r * rnd(0.05, 0.08), { color: '#b8862f', alpha: rnd(0.6, 0.9), bend: rnd(0.2, 0.5) });
      }
      M.dot(ctx, x, y, r * 0.1, { color: '#7d5a1e', alpha: 0.7 });
      // 茎：一节一弯，带细毛
      var st = curve(x + rnd(-2, 2), y + r * 0.7, Math.PI / 2 + rnd(-0.2, 0.2), rnd(28, 99 - y - r * 0.7), 8, rnd(-0.05, 0.05), 0.08);
      M.stroke(ctx, st, { w: 1.7, w2: 0.9, alpha: 0.62, color: '#4c5a3a', profile: 'taper', seg: 10, dry: 0.35 });
      // 菊叶：掌状几裂，淡墨一团加几道缺
      var sp = M.smooth(st, 10);
      for (var l = 0; l < rint(3, 5); l++) {
        var p = sp[rint(Math.round(sp.length * 0.3), sp.length - 2)];
        var side = chance(0.5) ? 1 : -1;
        lobedLeaf(ctx, p.x + side * rnd(4, 9), p.y + rnd(-2, 6),
          (side > 0 ? 0 : Math.PI) + rnd(-0.5, 0.5) + 0.3, rnd(7, 11), rnd(0.44, 0.64));
      }
    },

    blossom: function (ctx) {
      var col = M.pick(['#e293a6', '#d9768a', '#d05f74', '#e8b3c0']);
      // 一枝斜出的春花：先定枝条，再沿枝成团地开
      var dir = chance(0.55) ? 1 : -1;
      var x0 = dir > 0 ? rnd(-10, 2) : rnd(98, 110);
      var y0 = rnd(66, 86);
      var main = curve(x0, y0, dir > 0 ? -0.46 : -2.68, rnd(70, 92), 6, dir > 0 ? -0.09 : 0.09, 0.12);
      limb(ctx, main, { w: 4.2, w2: 0.8, alpha: 0.6, dry: 0.4, edgeAlpha: 0.22 });
      var twigs = [];
      for (var t = 0; t < rint(3, 5); t++) {
        var bp = main[rint(2, main.length - 1)];
        var tg = curve(bp.x, bp.y, (dir > 0 ? -1.15 : -2) + rnd(-0.9, 0.9), rnd(12, 22), 4, rnd(-0.14, 0.14), 0.16);
        limb(ctx, tg, { w: 1.6, w2: 0.35, alpha: 0.54, dry: 0.3, joints: false, edgeAlpha: 0.18 });
        twigs.push(tg);
      }
      var nodes = main.slice(1).concat(twigs.reduce(function (a, t) { return a.concat(t); }, []));
      // 后层：小而淡，虚在花后
      for (var b = 0; b < rint(7, 12); b++) {
        var np = nodes[rint(0, nodes.length - 1)];
        fiveFlower(ctx, np.x + rnd(-9, 9), np.y + rnd(-8, 8), rnd(2.4, 4), col, rnd(0.24, 0.42), '#c07a8c');
      }
      // 前层：饱满、有蕊、有苞
      for (var f = 0; f < rint(10, 16); f++) {
        var fp = nodes[rint(0, nodes.length - 1)];
        var fx = fp.x + rnd(-5, 5), fy = fp.y + rnd(-5, 5), fr = rnd(3.8, 7.2);
        if (chance(0.25)) {
          // 半开的花苞
          for (var k = 0; k < 3; k++) {
            var a2 = -1.57 + (k - 1) * 0.7;
            M.blade(ctx, fx, fy, fx + Math.cos(a2) * fr * 0.9, fy + Math.sin(a2) * fr * 0.9, fr * 0.4,
              { color: col, tip: M.darken(col, 0.6), base: '#fbeef0', alpha: rnd(0.75, 0.95), bulge: 1.4 });
          }
          M.dot(ctx, fx, fy + fr * 0.4, fr * 0.16, { color: '#7d3b46', alpha: 0.8 });
        } else {
          fiveFlower(ctx, fx, fy, fr, col, rnd(0.8, 1), '#8d3a4a');
        }
      }
      // 新叶
      for (var l = 0; l < rint(3, 6); l++) {
        var lp = nodes[rint(1, nodes.length - 1)];
        M.blade(ctx, lp.x, lp.y, lp.x + rnd(-10, 10), lp.y + rnd(3, 12), rnd(1.6, 2.8), { color: GREEN, alpha: rnd(0.3, 0.55) });
      }
      // 香气：一只小蝶缩到花边——整只压在枝上，主角就成了虫
      if (chance(0.6)) {
        ctx.save();
        ctx.translate(rnd(18, 82), rnd(18, 44));
        ctx.scale(rnd(0.4, 0.58), rnd(0.4, 0.58));
        ctx.translate(-50, -50);
        MOTIFS.butterfly(ctx);
        ctx.restore();
      }
      // 落英
      for (var p = 0; p < rint(6, 14); p++) {
        M.petal(ctx, rnd(6, 94), rnd(30, 98), rnd(1.4, 3.2), rnd(0.9, 2), rnd(0, 3.14), { color: col, alpha: rnd(0.28, 0.62) });
      }
      M.splatter(ctx, main[2].x, main[2].y, 26, 16, { color: col, alpha: 0.35, max: 1.2 });
      M.wash(ctx, main[2].x, main[2].y - 6, 34, 26, { color: col, alpha: 0.08 });
      M.wash(ctx, 50, 94, 46, 8, { color: INK, alpha: 0.08 });
    },

    grass: function (ctx) {
      var base = rnd(84, 93), x0 = rnd(8, 26), span = rnd(52, 82);
      // 草：一丛挤着长，长短斜正互相破开——稀稀拉拉十几根细棍是针不是草
      var n = rint(26, 40);
      var blades = [];
      for (var i = 0; i < n; i++) {
        var x = x0 + span * Math.pow(rnd(0, 1), 0.8);
        var side = rnd(-1, 1);
        var tall = rnd(0, 1) > 0.72;
        blades.push({ x: x, side: side, len: tall ? rnd(26, 46) : rnd(9, 26), w: tall ? rnd(1.8, 3) : rnd(1, 2) });
      }
      blades.forEach(function (B) {
        var pts = curve(B.x, base + rnd(-1, 1.5), -Math.PI / 2 + B.side * rnd(0.04, 0.46), B.len, 6,
          B.side * rnd(0.03, 0.16), 0.06);
        M.stroke(ctx, pts, {
          w: B.w, w2: 0.1, alpha: rnd(0.3, 0.72), color: chance(0.3) ? '#4a5c3a' : INK,
          profile: 'taper', seg: 11, dry: rnd(0, 1) > 0.6 ? 0.35 : 0, cap: false
        });
      });
      // 一两支穗子挑出来：谷粒只长在末梢一小段，一路都长毛就成了瓶刷
      for (var s = 0; s < rint(1, 3); s++) {
        var sx = x0 + rnd(0, span);
        var sd = chance(0.5) ? 1 : -1;
        var sc = curve(sx, base, -Math.PI / 2 + sd * rnd(0.06, 0.22), rnd(30, 46), 8, sd * rnd(0.05, 0.13), 0.04);
        M.stroke(ctx, sc, { w: 0.9, w2: 0.18, alpha: rnd(0.34, 0.5), profile: 'taper', seg: 9, cap: false });
        var sp = M.smooth(sc, 9);
        var head = sp[sp.length - 1];
        var n0 = Math.max(1, Math.round(sp.length * 0.66));
        var ga = Math.atan2(head.y - sp[n0].y, head.x - sp[n0].x);
        for (var k = 0; k < rint(4, 7); k++) {
          var hp = sp[rint(n0, sp.length - 1)];
          taperLeaf(ctx, hp.x, hp.y, ga + rnd(-0.75, 0.75), rnd(2.2, 3.8), rnd(0.45, 0.8),
            { color: '#8a7a3c', alpha: rnd(0.35, 0.6), bend: rnd(-0.12, 0.12) });
        }
        M.dot(ctx, head.x, head.y, rnd(0.4, 0.7), { color: '#6f5f2c', alpha: 0.5 });
      }
      // 根脚一团淡墨把丛收住，再压两笔短草
      // 先给一道地平：草是长在地的，浮在空纸上就是几根针
      M.stroke(ctx, [{ x: 2, y: base + 2 }, { x: x0 + span * 0.5, y: base + rnd(0.6, 2.2) }, { x: 98, y: base + 1.6 }],
        { w: 1.5, w2: 0.4, alpha: 0.26, profile: 'flat', seg: 14, dry: 0.6, cap: false });
      M.wash(ctx, 50, base + 6, 52, 5, { color: '#8b7f68', alpha: 0.1 });
      M.wash(ctx, x0 + span * 0.5, base + 1, span * 0.55, 4.5, { color: INK, alpha: 0.09 });
      for (var q = 0; q < rint(3, 6); q++) {
        var qx = x0 + rnd(0, span);
        M.stroke(ctx, [{ x: qx, y: base + rnd(0, 2) }, { x: qx + rnd(-4, 4), y: base - rnd(3, 7) }],
          { w: 1.4, w2: 0.15, alpha: rnd(0.4, 0.65), profile: 'taper', seg: 3, cap: false });
      }
      M.moss(ctx, x0 + rnd(0, span), base + 1, rint(2, 4), { spread: 4, min: 0.3, max: 0.8, alpha: 0.45 });
    },

    leaf: function (ctx) {
      var x = rnd(38, 62), y = rnd(40, 58);
      var len = rnd(34, 52), w = len * rnd(0.3, 0.42);
      var rot = rnd(-0.7, 0.7) + (chance(0.5) ? Math.PI : 0);
      var bend = rnd(-0.14, 0.14);
      var col = chance(0.45) ? INK : GREEN;
      var dk = M.darken(col, 0.6);
      var fat = rnd(0.85, 1.2);

      function edge(s) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (var i = 0; i <= 16; i++) {
          var t = i / 16;
          var yy = Math.sin(Math.PI * Math.pow(t, 0.85)) * w * s * (1 - 0.25 * t);
          ctx.lineTo(t * len, yy + bend * t * t * len);
        }
        for (var j = 16; j >= 0; j--) {
          var u = j / 16;
          var y2 = -Math.sin(Math.PI * Math.pow(u, 0.85)) * w * (2 - s) * (1 - 0.25 * u);
          ctx.lineTo(u * len, y2 + bend * u * u * len);
        }
        ctx.closePath();
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      // 没骨：先洇一层淡，再压根淡尖浓的主身
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = col;
      edge(fat * 1.14);
      ctx.fill();
      var g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, M.hexA(M.lighten(col, 1.7), 0.26));
      g.addColorStop(0.42, M.hexA(col, 0.38));
      g.addColorStop(1, M.hexA(dk, 0.56));
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      edge(fat);
      ctx.fill();
      // 虫蚀：边上咬掉一两个缺口，全须全尾的叶子是剪纸
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      for (var e2 = 0; e2 < rint(1, 3); e2++) {
        var et = rnd(0.24, 0.8), ey = (chance(0.5) ? 1 : -1) * Math.sin(Math.PI * Math.pow(et, 0.85)) * w * fat * 0.9;
        ctx.beginPath();
        ctx.ellipse(et * len, ey + bend * et * et * len, len * rnd(0.04, 0.08), w * rnd(0.12, 0.26), rnd(-0.4, 0.4), 0, 6.2832);
        ctx.fill();
      }
      ctx.restore();
      // 筋脉一律裁在叶形里，出边一截就成了铁丝
      ctx.save();
      edge(fat);
      ctx.clip();
      // 中筋：暗叶用亮筋才看得见
      var vein = M.hexA(M.lighten(col, 2.1), 0.5);
      ctx.strokeStyle = vein;
      ctx.lineWidth = Math.max(0.3, len * 0.014);
      ctx.beginPath();
      ctx.moveTo(len * 0.02, 0);
      ctx.quadraticCurveTo(len * 0.5, bend * len * 0.3, len * 0.98, bend * len * 0.9);
      ctx.stroke();
      ctx.strokeStyle = M.hexA(dk, 0.3);
      ctx.lineWidth = Math.max(0.25, len * 0.008);
      ctx.beginPath();
      ctx.moveTo(len * 0.04, len * 0.012);
      ctx.quadraticCurveTo(len * 0.5, bend * len * 0.3 + len * 0.014, len * 0.96, bend * len * 0.9);
      ctx.stroke();
      // 侧脉：斜着走向边，横着排就成了篦子
      var nv = rint(5, 7);
      ctx.lineWidth = Math.max(0.18, len * 0.007);
      ctx.strokeStyle = M.hexA(M.lighten(col, 2.0), 0.34);
      for (var v = 0; v < nv; v++) {
        var t2 = 0.14 + v / nv * 0.66;
        var mx = t2 * len, my = bend * t2 * t2 * len;
        var half = Math.sin(Math.PI * Math.pow(t2, 0.85)) * w * Math.min(fat, 2 - fat) * (1 - 0.25 * t2);
        for (var sg = -1; sg <= 1; sg += 2) {
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.quadraticCurveTo(mx + len * 0.07, my + sg * half * 0.55, mx + len * 0.13, my + sg * half * 0.92);
          ctx.stroke();
        }
      }
      // 叶面上压两片浓淡，叶子才有向背
      for (var m2 = 0; m2 < rint(2, 4); m2++) {
        M.wash(ctx, rnd(0.2, 0.8) * len, rnd(-0.5, 0.5) * w, len * rnd(0.1, 0.22), w * rnd(0.16, 0.34),
          { color: dk, alpha: rnd(0.1, 0.2) });
      }
      ctx.restore();
      ctx.restore();
      // 柄：从根部斜拖出去
      var px = x - Math.cos(rot) * rnd(5, 11), py = y - Math.sin(rot) * rnd(5, 11) + rnd(2, 8);
      M.stroke(ctx, [{ x: x, y: y }, { x: (x + px) / 2 + rnd(-3, 3), y: (y + py) / 2 }, { x: px, y: py }],
        { w: 1.2, w2: 0.3, alpha: 0.6, profile: 'taper', seg: 7, dry: 0.35 });
    },

    branch: function (ctx) {
      var dir = chance(0.6) ? 1 : -1;
      var x0 = dir > 0 ? rnd(-8, 2) : rnd(98, 108);
      var main = curve(x0, rnd(80, 98), dir > 0 ? -0.7 : -2.44, rnd(58, 74), 7, dir > 0 ? -0.06 : 0.06, 0.12);
      limb(ctx, main, { w: 5, w2: 1.3, alpha: 0.66, dry: 0.4, edgeAlpha: 0.22, washAlpha: 0.05 });
      var nodes = [];
      for (var i = 2; i < main.length; i++) nodes.push(main[i]);
      var twigs = [];
      for (var t = 0; t < rint(3, 5); t++) {
        var np = nodes[rint(0, nodes.length - 1)];
        var tw = curve(np.x, np.y, (dir > 0 ? -1.2 : -1.95) + rnd(-0.9, 0.9), rnd(12, 22), 5, rnd(-0.12, 0.12), 0.14);
        M.stroke(ctx, tw, { w: 1.5, w2: 0.3, alpha: 0.7, profile: 'taper', seg: 9, dry: 0.45 });
        twigs.push(tw);
        nodes = nodes.concat(tw.slice(1));
      }
      // 叶：沿主干和分枝一路三五处一组，组内两三撇——全堆在梢头就是鸡毛掸子
      function cluster(x, y, base, s, alpha) {
        var cnt = rint(2, 4);
        var span = rnd(1.0, 1.5);
        for (var k = 0; k < cnt; k++) {
          var t = cnt === 1 ? 0.5 : k / (cnt - 1);
          var a = base + (t - 0.5) * span + rnd(-0.12, 0.12);
          var len = s * (0.62 + Math.abs(t - 0.5) * 0.5 + rnd(0.1, 0.5));
          taperLeaf(ctx, x, y, a, len, len * rnd(0.2, 0.3), {
            color: chance(0.42) ? GREEN : INK, alpha: alpha * rnd(0.45, 0.9), bend: rnd(0.12, 0.36)
          });
        }
        if (chance(0.4)) M.dot(ctx, x, y, rnd(0.5, 1.1), { color: M.darken(INK, 0.6), alpha: alpha * 0.7 });
      }
      var mp = M.smooth(main, 11);
      // smooth 出来的是几十个点，按分数取样——每三五点挂一组就成了蜈蚣
      function spotAt(pts, k, nk) {
        return clamp(Math.round(3 + (pts.length - 6) * (nk <= 1 ? 0.5 : k / (nk - 1))), 2, pts.length - 2);
      }
      var nMain = rint(3, 4);
      for (var m = 0; m < nMain; m++) {
        var mi = spotAt(mp, m, nMain), pm = mp[mi], po = mp[Math.min(mp.length - 1, mi + 2)];
        var ba = Math.atan2(po.y - pm.y, po.x - pm.x);
        cluster(pm.x, pm.y, ba + (chance(0.6) ? 1 : -1) * rnd(0.8, 1.2), rnd(6, 9), rnd(0.42, 0.6));
      }
      twigs.forEach(function (tw) {
        var tp = M.smooth(tw, 9);
        var nTw = rint(1, 2);
        for (var g = 0; g < nTw; g++) {
          var gi = spotAt(tp, g, nTw), q = tp[gi], q2 = tp[Math.min(tp.length - 1, gi + 2)];
          cluster(q.x, q.y, Math.atan2(q.y - q2.y, q.x - q2.x) + (chance(0.5) ? 1 : -1) * rnd(0.5, 0.9),
            rnd(7, 10), rnd(0.5, 0.7));
        }
        var tip = tp[tp.length - 1];
        cluster(tip.x, tip.y, Math.atan2(tip.y - tp[tp.length - 4].y, tip.x - tp[tp.length - 4].x), rnd(8, 12), rnd(0.58, 0.76));
      });
      M.air(ctx, main[4].x, main[4].y + 8, 30, 16, {});
    },

    tree: function (ctx) {
      var x = rnd(34, 64), top = rnd(16, 28);
      var lean = rnd(-0.26, 0.26);
      // 起笔放到画外，圆锋的顿点才不会留在脚边
      var trunk = curve(x, 102, -Math.PI / 2 + lean, 102 - top, 9, -lean * 0.05, 0.14);
      limb(ctx, trunk, { w: 7.5, w2: 2.2, alpha: 0.56, dry: 0.28, edgeAlpha: 0.16, washAlpha: 0.06, seg: 10 });
      var tp = M.smooth(trunk, 12);
      // 干上的疤：两三处拧着的浓墨，一路光洁就成了电线杆
      for (var kk = 0; kk < rint(2, 4); kk++) {
        var kp = tp[rint(Math.round(tp.length * 0.15), Math.round(tp.length * 0.75))];
        var kw = rnd(1.2, 2.4) * (0.5 + kp.y / 140);
        M.wash(ctx, kp.x + rnd(-kw, kw), kp.y, kw * 1.5, kw, { color: M.darken(INK, 0.6), alpha: rnd(0.2, 0.36) });
      }
      // 主枝四散，冠就长在枝头上
      var tips = [];
      for (var i = 0; i < rint(4, 6); i++) {
        var a0 = tp[rint(Math.round(tp.length * 0.4), tp.length - 1)];
        var ang = -Math.PI / 2 + rnd(-1.15, 1.15);
        var arm = curve(a0.x, a0.y, ang, rnd(16, 30), 6, rnd(-0.06, 0.06), 0.12);
        limb(ctx, arm, { w: rnd(2, 3.4), w2: rnd(0.6, 1.2), alpha: 0.64, seg: 8, joints: false, dry: 0.5, edgeAlpha: 0.3 });
        var ap = M.smooth(arm, 9);
        tips.push({ x: ap[ap.length - 1].x, y: ap[ap.length - 1].y, r: rnd(9, 14), a: rnd(0.44, 0.62) });
      }
      var crown = tp[tp.length - 1];
      tips.push({ x: crown.x + rnd(-4, 4), y: crown.y - rnd(2, 8), r: rnd(11, 15), a: 0.7 });
      // 先铺一层团块底墨，叶才不是散在空中的碎片
      var cx = 0, cy = 0;
      tips.forEach(function (t) { cx += t.x; cy += t.y; });
      cx /= tips.length; cy /= tips.length;
      // 团块底墨跟着枝头的分布走，糊成一坨就成了一把伞
      tips.forEach(function (t) {
        M.wash(ctx, t.x + rnd(-2, 2), t.y + rnd(-1, 3), t.r * rnd(1.1, 1.5), t.r * rnd(0.85, 1.15),
          { color: chance(0.35) ? GREEN : INK, alpha: rnd(0.07, 0.12) });
      });
      M.wash(ctx, cx, cy, rnd(16, 22), rnd(12, 17), { color: INK, alpha: 0.07 });
      tips.forEach(function (t) { foliage(ctx, t.x, t.y, t.r, t.a); });
      // 团块之间点几处浓墨，压出前后
      for (var d = 0; d < rint(6, 12); d++) {
        var q2 = tips[rint(0, tips.length - 1)];
        M.dot(ctx, q2.x + rnd(-q2.r * 0.7, q2.r * 0.7), q2.y + rnd(-q2.r * 0.5, q2.r * 0.5),
          rnd(0.7, 1.7), { color: M.darken(INK, 0.6), alpha: rnd(0.28, 0.55) });
      }
      // 梢头留几笔空，透透气
      for (var s = 0; s < rint(3, 6); s++) {
        var q = tips[rint(0, tips.length - 1)];
        M.stroke(ctx, [{ x: q.x, y: q.y }, { x: q.x + rnd(-q.r, q.r) * 1.6, y: q.y - rnd(q.r * 0.6, q.r * 1.3) }],
          { w: 0.9, w2: 0.25, alpha: 0.42, profile: 'taper', seg: 6 });
      }
      M.moss(ctx, x + rnd(-8, 8), 95, rint(3, 6), { spread: 6, min: 0.3, max: 0.9, alpha: 0.5 });
      M.wash(ctx, x, 97, 26, 4, { color: INK, alpha: 0.1 });
    },

    field: function (ctx) {
      var hy = rnd(42, 54);            // 地平线
      var vx = rnd(36, 64);            // 纵向埂的收敛点
      var fh = rnd(7, 12);             // 远山高度：山脚正好收在地平线上，别留一条直边
      farHills(ctx, hy - fh, fh, 0.11);
      M.stroke(ctx, [{ x: -2, y: hy }, { x: 44 + rnd(-8, 8), y: hy - rnd(-0.8, 0.8) }, { x: 102, y: hy }],
        { w: 1.2, w2: 0.6, alpha: 0.3, profile: 'flat', seg: 14, color: '#4a4436' });
      // 灌了水的田：一层天光
      M.wash(ctx, 50, (hy + 98) / 2, 54, (98 - hy) / 2 + 4, { color: BLUE, alpha: 0.06 });
      M.wash(ctx, vx, hy + 5, 46, 7, { color: INK, alpha: 0.07 });
      var rows = rint(5, 7);
      var band = [];                                  // 透视压紧，再打乱一点：等距就成了五线谱
      for (var i = 0; i < rows; i++) {
        band.push(clamp(Math.pow(i / (rows - 1), 1.5) + (i === 0 || i === rows - 1 ? 0 : rnd(-0.045, 0.045)), 0, 1));
      }
      // 横向田埂：土埂是断的、浅的，通栏一根黑条是木头
      band.forEach(function (t, i) {
        var yy = hy + t * (96 - hy);
        var w = 0.35 + t * 0.95;
        var sx0 = -4;
        while (sx0 < 100) {
          var x1 = Math.min(104, sx0 + rnd(16, 46) * (0.6 + t * 0.8));
          M.stroke(ctx, [{ x: sx0, y: yy + rnd(-0.8, 0.8) },
            { x: (sx0 + x1) / 2, y: yy - (0.5 + t * 2.4) * rnd(0.6, 1.4) },
            { x: x1, y: yy + rnd(-1, 1.6) }],
            { w: w, w2: w * 0.6, alpha: 0.1 + t * 0.2, profile: 'flat', seg: 12, color: '#4a4232', jitter: 0.5, cap: false });
          sx0 = x1 + rnd(3, 13);
        }
        if (i > 0) {                                        // 埂下的水面反光
          M.wash(ctx, rnd(18, 82), yy - rnd(1.5, 3.5), rnd(12, 26), 0.9 + t * 1.6, { color: '#f6f1de', alpha: 0.16 + t * 0.16 });
        }
      });
      // 纵向田埂：弯着走向消失点，一路顶到地平线就成了电线
      for (var k = 0; k < rint(1, 3); k++) {
        var bx = rnd(6, 94), by = rnd(93, 99);
        var frac = rnd(0.42, 0.82);
        var ex = bx + (vx - bx) * frac, ey = by - (by - hy) * frac;
        M.stroke(ctx, [{ x: bx, y: by },
          { x: (bx + ex) / 2 + rnd(-5, 5), y: (by + ey) / 2 + rnd(-1.5, 1.5) },
          { x: ex, y: ey }],
          { w: rnd(0.5, 1.1), w2: 0.2, alpha: rnd(0.12, 0.24), profile: 'taper', seg: 10, color: '#4a4232', jitter: 0.45, cap: false });
      }
      // 秧苗：一丘一丘成行，一丛两三笔带弯，远小近大
      for (var b = 0; b < rows - 1; b++) {
        var y0 = hy + band[b] * (96 - hy) + 1.8;
        var y1 = hy + band[b + 1] * (96 - hy) - 1.6;
        if (y1 <= y0) continue;
        var depth = (band[b] + band[b + 1]) / 2;
        var hh0 = 1.2 + depth * 4.2;
        var lineN = rint(2, 4);
        for (var L = 0; L < lineN; L++) {
          var ly = y0 + (y1 - y0) * ((L + 0.5) / lineN);
          var lean = rnd(-0.45, 0.45);                     // 一行一个倾向，才像风里长的
          for (var sx = rnd(-2, 6); sx < 100; sx += (3.4 + depth * 5) * rnd(0.7, 1.4)) {
            if (chance(0.22)) continue;                     // 断断续续，别排成栅栏
            var nq = rint(2, 4);
            var hh = hh0 * rnd(0.6, 1.3);
            for (var q = 0; q < nq; q++) {
              var a = -Math.PI / 2 + (q - (nq - 1) / 2) * rnd(0.32, 0.62) + lean * rnd(0.4, 1);
              M.stroke(ctx, [{ x: sx + rnd(-0.6, 0.6), y: ly },
                { x: sx + Math.cos(a) * hh * 0.5, y: ly + Math.sin(a) * hh * 0.6 },
                { x: sx + Math.cos(a) * hh, y: ly + Math.sin(a) * hh }],
                { w: 0.35 + depth * 0.6, w2: 0.1, alpha: 0.16 + depth * 0.4, profile: 'taper', seg: 3, cap: false,
                  color: chance(0.35) ? '#5a6b3e' : '#3c4630' });
            }
          }
        }
      }
      // 田角一丛草、远处一棵树，别太干净
      M.moss(ctx, rnd(6, 20), 96, rint(3, 5), { spread: 5, min: 0.4, max: 1.1, alpha: 0.5 });
      if (chance(0.7)) {
        var tx = rnd(72, 92), ty = hy + rnd(3, 10);
        M.stroke(ctx, [{ x: tx, y: ty + rnd(5, 9) }, { x: tx + rnd(-1, 1), y: ty }], { w: 0.9, w2: 0.3, alpha: 0.55, profile: 'taper', seg: 4 });
        foliage(ctx, tx, ty - 1, rnd(3.5, 6), 0.4);
      }
    },

    /* ———— 山水 ———— */
    mountain: function (ctx) {
      var base = rnd(76, 90), peak = rnd(12, 26), x0 = rnd(-4, 8), x1 = rnd(92, 104);
      var steps = 34, pts = [];
      // 两三个峰头错开叠起——单个 sin 包就是一个蘑菇
      var pk = [];
      var main = rnd(0.34, 0.62);
      pk.push({ c: main, h: 1, w: rnd(0.13, 0.24) });
      for (var q = 0; q < rint(1, 3); q++) pk.push({ c: clamp(main + rnd(-0.55, 0.55), 0.05, 0.95), h: rnd(0.35, 0.8), w: rnd(0.09, 0.2) });
      function envAt(t) {
        var s = 0;
        for (var i = 0; i < pk.length; i++) {
          var dd = (t - pk[i].c) / pk[i].w;
          s += pk[i].h * Math.exp(-dd * dd);
        }
        return Math.min(1, s);
      }
      var expo = rnd(0.72, 1.05), notch = rnd(2.2, 4.4), wv = rnd(4, 9), dy = 0;
      for (var i = 0; i <= steps; i++) {
        var t = i / steps, x = x0 + (x1 - x0) * t;
        var e = envAt(t);
        dy = (dy + rnd(-2.4, 2.4)) * 0.6;               // 有连贯性的乱，逐点独立就成了锯齿
        pts.push({ x: x, y: base - (base - peak) * Math.pow(e, expo) + (dy + notch * Math.sin(t * wv)) * e });
      }
      // 山体：上浓下淡的湿墨，底边一路淡到不见
      function bodyPath() {
        ctx.beginPath();
        ctx.moveTo(pts[0].x - 26, base + 34);
        ctx.lineTo(pts[0].x, pts[0].y);
        pts.forEach(function (p) { ctx.lineTo(p.x, p.y); });
        ctx.lineTo(pts[steps].x + 26, base + 34);
        for (var j = steps; j >= 0; j -= 2) ctx.lineTo(pts[j].x, base + 30 + Math.sin(j * 0.9) * rnd(1, 4));
        ctx.closePath();
      }
      ctx.save();
      bodyPath();
      var g = ctx.createLinearGradient(0, peak, 0, base + 14);
      g.addColorStop(0, M.hexA(INK, 0.72));
      g.addColorStop(0.4, M.hexA(INK, 0.42));
      g.addColorStop(0.78, M.hexA(INK, 0.14));
      g.addColorStop(1, M.hexA(INK, 0));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      // 脊线：浓墨勾一遍，略留飞白
      M.stroke(ctx, pts, { w: 2.2, w2: 0.6, alpha: 0.82, profile: 'taper', dry: 0.18, seg: 4 });
      // 皴：裁在山形里，出边一截就成了草不是石
      ctx.save();
      bodyPath();
      ctx.clip();
      var cxx = x0 + (x1 - x0) * main;
      for (var c = 0; c < rint(30, 46); c++) {
        var ci = rint(2, steps - 2), cp = pts[ci];
        if (cp.y > base - 8) continue;                 // 淡到看不见的地方不皴，出边就是草
        var shade = cp.x > cxx ? 1 : 0.5;              // 阳面少皴
        var down = Math.min(rnd(5, 24) * shade, base - 3 - cp.y);
        if (down < 2) continue;
        M.stroke(ctx, [{ x: cp.x + rnd(-2, 2), y: cp.y + rnd(1, 5) },
          { x: cp.x + rnd(-5, 5), y: cp.y + down * 0.6 },
          { x: cp.x + rnd(-9, 9), y: cp.y + down }],
          { w: rnd(0.7, 1.9), w2: 0.2, alpha: rnd(0.16, 0.34) * shade, profile: 'taper', seg: 5, color: M.darken(INK, 0.7) });
      }
      // 山坳里点几丛浓墨，山才厚
      for (var d = 0; d < rint(6, 12); d++) {
        var dp = pts[rint(4, steps - 4)];
        if (dp.y > base - 10) continue;
        M.dot(ctx, dp.x + rnd(-3, 3), dp.y + rnd(3, Math.max(4, base - 8 - dp.y)), rnd(0.7, 1.9),
          { color: M.darken(INK, 0.55), alpha: rnd(0.2, 0.4) });
      }
      ctx.restore();
      // 山脚化进雾里：一道由淡到全擦的竖渐变，椭圆擦不平，会留一条底边
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      var eg = ctx.createLinearGradient(0, base - 12, 0, base + 18);
      eg.addColorStop(0, M.hexA('#000', 0));
      eg.addColorStop(0.45, M.hexA('#000', 0.5));
      eg.addColorStop(1, M.hexA('#000', 1));
      ctx.fillStyle = eg;
      ctx.fillRect(x0 - 8, base - 12, (x1 - x0) + 16, 30);
      ctx.restore();
      M.wash(ctx, (x0 + x1) / 2, base + 8, (x1 - x0) * 0.6, 9, { color: '#f4eeda', alpha: 0.12 });
      // 远峰一小笔
      if (chance(0.6)) {
        var bx = x0 + (x1 - x0) * rnd(0.05, 0.35), by = base - rnd(6, 18);
        M.wash(ctx, bx, by, 16, 12, { color: INK, alpha: 0.16 });
      }
      if (chance(0.5)) {
        var px = rnd(30, 70), py = base - rnd(20, 40);
        M.stroke(ctx, [{ x: px - 4, y: py }, { x: px, y: py - 3 }, { x: px + 4, y: py }], { w: 0.8, alpha: 0.6, profile: 'flat' });
      }
    },

    water: function (ctx) {
      var y0 = rnd(30, 44);                    // 岸线
      // 天光：上面一层几乎看不出的青，水才有得反射
      M.wash(ctx, 50, y0 - 18, 56, 20, { color: BLUE, alpha: 0.05 });
      farHills(ctx, y0 - rnd(5, 11), rnd(5, 9), 0.09);
      // 岸：一条断续的浅线
      var shore = [];
      for (var i = 0; i <= 7; i++) shore.push({ x: -4 + 112 * i / 7, y: y0 + rnd(-1.2, 1.2) });
      M.stroke(ctx, shore, { w: 1.1, w2: 0.5, alpha: 0.26, profile: 'flat', seg: 16, jitter: 0.4, cap: false });
      // 倒影：岸上一棵树化在水里，一段段散开
      if (chance(0.7)) {
        var tx = rnd(14, 86);
        for (var d = 0; d < rint(4, 7); d++) {
          var dy = y0 + 2 + d * rnd(2.2, 4);
          M.stroke(ctx, [{ x: tx - rnd(1, 5), y: dy }, { x: tx + rnd(1, 5), y: dy }],
            { w: rnd(1, 2.4), w2: 0.6, alpha: Math.max(0.05, 0.2 - d * 0.028), profile: 'flat', seg: 4, cap: false });
        }
      }
      // 波纹：越近越长越疏
      ripples(ctx, y0 + 4, 94, rint(8, 11), {});
      // 近处一道长浪走三遍墨
      for (var w = 0; w < rint(1, 3); w++) {
        var wy = rnd(72, 92);
        var pts = [{ x: rnd(-4, 8), y: wy }];
        for (var s = 1; s <= 4; s++) pts.push({ x: s * 26 + rnd(-4, 4), y: wy - Math.sin(s * 1.4 + w) * rnd(1.5, 3.5) });
        M.ink3(ctx, pts, { w: 1.4, w2: 0.5, alpha: 0.26, profile: 'flat', seg: 13, core: false, color: chance(0.4) ? BLUE : INK });
      }
      // 浮萍三五点 / 一叶小舟
      if (chance(0.45)) {
        var fx = rnd(18, 78), fy = y0 + rnd(10, 40);
        for (var g = 0; g < rint(3, 5); g++) {
          M.wash(ctx, fx + rnd(-8, 8), fy + rnd(-2.5, 2.5), rnd(1.4, 2.8), rnd(0.7, 1.4), { color: GREEN, alpha: rnd(0.3, 0.5) });
        }
      } else if (chance(0.7)) {
        var bx = rnd(20, 80), by = rnd(56, 82), bs = rnd(7, 13);
        M.stroke(ctx, [{ x: bx - bs, y: by }, { x: bx - bs * 0.4, y: by + bs * 0.34 }, { x: bx + bs * 0.5, y: by + bs * 0.3 }, { x: bx + bs, y: by - bs * 0.05 }],
          { w: bs * 0.16, w2: bs * 0.08, alpha: 0.62, profile: 'flat', seg: 6, color: M.darken(INK, 0.7), cap: false });
        M.stroke(ctx, [{ x: bx + bs * 0.1, y: by - bs * 0.1 }, { x: bx + bs * 0.1 + rnd(-1, 1), y: by - bs * rnd(0.8, 1.3) }],
          { w: 0.7, w2: 0.3, alpha: 0.6, profile: 'taper', seg: 3, cap: false });
        M.wash(ctx, bx, by + bs * 0.7, bs * 1.3, 1.4, { color: INK, alpha: 0.14 });
      }
      // 水边芦苇两三株
      if (chance(0.55)) {
        var rx = chance(0.5) ? rnd(4, 14) : rnd(84, 96);
        for (var i2 = 0; i2 < rint(2, 3); i2++) {
          var reedX = rx + rnd(-5, 5), reedY = rnd(88, 98), top = reedY - rnd(30, 48);
          M.stroke(ctx, [{ x: reedX, y: reedY }, { x: reedX + rnd(-4, 4), y: (reedY + top) / 2 }, { x: reedX + rnd(-9, 9), y: top }],
            { w: 1.1, w2: 0.3, alpha: 0.6, profile: 'taper', seg: 9, cap: false });
          for (var l = 0; l < rint(2, 4); l++) {
            var ly = reedY - rnd(8, 24);
            M.blade(ctx, reedX, ly, reedX + rnd(-9, 9), ly - rnd(6, 13), rnd(1, 1.8), { color: INK, alpha: rnd(0.3, 0.5) });
          }
        }
      }
    },

    wave: function (ctx) {
      // 浪：远处只有线，近处才卷花。一排一样大的半圆是瓦片，不是水
      var hy = rnd(18, 28);
      M.stroke(ctx, [{ x: 4, y: hy }, { x: 52, y: hy + rnd(-0.8, 1.2) }, { x: 96, y: hy + rnd(-1, 1) }],
        { w: 1.2, w2: 0.4, alpha: 0.3, profile: 'flat', seg: 14, dry: 0.55, cap: false });
      M.wash(ctx, 50, hy - 8, 54, 9, { color: BLUE, alpha: 0.07 });
      // 海平线以下：越近越宽的横纹，断着走
      for (var i = 0; i < rint(5, 8); i++) {
        var t = i / 8;
        var y = hy + 2 + Math.pow(rnd(0, 1), 0.8) * (96 - hy);
        var near = (y - hy) / (96 - hy);
        var x0 = rnd(-6, 40), x1 = x0 + rnd(8, 26) + near * rnd(10, 34);
        var pts = [{ x: x0, y: y }];
        for (var s = 1; s <= 3; s++) {
          pts.push({ x: x0 + (x1 - x0) * s / 3, y: y + Math.sin(s * 1.7 + i) * (0.4 + near * 1.6) * rnd(0.6, 1.3) });
        }
        M.stroke(ctx, pts, { w: 0.6 + near * 1.8, w2: 0.2, alpha: 0.1 + near * 0.2,
          profile: 'flat', seg: 8, color: chance(0.6) ? BLUE : INK, cap: false, dry: 0.4 });
      }
      // 两三个真正卷起来的浪头，一大一小，位置错开
      var nC = rint(2, 3);
      for (var c = 0; c < nC; c++) {
        var big = c === 0 ? rnd(11, 16) : rnd(5, 10);
        var wx = rnd(12, 88), wy = hy + 10 + c * rnd(16, 26) + rnd(-4, 4);
        var dir = chance(0.6) ? 1 : -1;
        // 浪身：一道前推的长弧，两头细中间粗
        var bodyP = [{ x: wx - dir * big * 2.6, y: wy + big * 0.5 }];
        for (var q = 1; q <= 5; q++) {
          var u = q / 5;
          bodyP.push({ x: wx - dir * big * (2.6 - u * 2.6), y: wy + big * 0.5 - Math.sin(u * 2.1) * big * 0.9 });
        }
        M.stroke(ctx, bodyP, { w: big * 0.34, w2: big * 0.05, alpha: 0.5, profile: 'swell', seg: 8,
          color: BLUE, cap: false, bleed: 0.3 });
        // 卷尖：一路收紧的涡，只卷顶端一小截
        spiral(ctx, wx + dir * big * 0.2, wy - big * 0.5, big * 0.62, rnd(0.85, 1.2), dir,
          { w: big * 0.2, w2: big * 0.03, alpha: 0.6, profile: 'taper', seg: 5, cap: false, color: INK });
        // 浪尖留一道白，沫子才亮
        M.stroke(ctx, bodyP.slice(2), { w: big * 0.1, w2: big * 0.02, alpha: 0.5, profile: 'taper',
          seg: 6, cap: false, color: '#f4eeda' });
        // 溅起的沫：散在卷尖外圈，不能排成队
        for (var f = 0; f < rint(7, 14); f++) {
          var fa = rnd(-1.1, 2.1) * dir, fd = big * rnd(0.4, 1.7);
          M.dot(ctx, wx + Math.cos(fa) * fd * dir, wy - big * 0.5 + Math.sin(fa) * fd * 0.7 - rnd(0, big * 0.5),
            rnd(0.3, 1.1), { color: chance(0.6) ? '#f6f1de' : BLUE, alpha: rnd(0.4, 0.75) });
        }
        M.splatter(ctx, wx, wy - big * 0.6, big * 1.4, rint(4, 8), { color: BLUE, alpha: 0.24, max: 0.9 });
        M.wash(ctx, wx - dir * big, wy + big * 0.8, big * 1.8, big * 0.5, { color: BLUE, alpha: 0.09 });
      }
      // 最前面一道压边的涌，把画面兜住
      var fy = rnd(86, 94);
      var fp = [{ x: -4, y: fy }];
      for (var m = 1; m <= 6; m++) fp.push({ x: -4 + 108 * m / 6, y: fy - Math.sin(m * 1.3 + rnd(0, 1)) * rnd(2, 5) });
      M.stroke(ctx, fp, { w: rnd(2.4, 4), w2: 0.8, alpha: 0.34, profile: 'swell', seg: 10, color: INK, cap: false, dry: 0.4 });
      for (var d2 = 0; d2 < rint(8, 16); d2++) {
        M.dot(ctx, rnd(2, 98), fy - rnd(0, 5), rnd(0.3, 1), { color: '#f6f1de', alpha: rnd(0.35, 0.65) });
      }
      M.wash(ctx, 50, 98, 56, 6, { color: INK, alpha: 0.1 });
    },
    rock: function (ctx) {
      // 石：底平、面折、棱硬。一圈椭圆加淡影是气球，不是石头
      var cx = rnd(40, 58), by = rnd(70, 80), w = rnd(19, 28), h = w * rnd(1.15, 1.55);
      var top = by - h;
      var pk = { x: cx + rnd(-w * 0.16, w * 0.24), y: top + rnd(0, h * 0.08) };
      var pts = [
        { x: cx - w * 0.6, y: by },
        { x: cx - w * rnd(0.66, 0.78), y: by - h * rnd(0.24, 0.34) },
        { x: cx - w * rnd(0.4, 0.5), y: by - h * rnd(0.46, 0.56) },
        { x: cx - w * rnd(0.46, 0.56), y: by - h * rnd(0.66, 0.76) },
        { x: cx - w * rnd(0.16, 0.3), y: top + h * rnd(0.12, 0.24) },
        pk,
        { x: cx + w * rnd(0.3, 0.44), y: top + h * rnd(0.28, 0.42) },
        { x: cx + w * rnd(0.24, 0.36), y: by - h * rnd(0.5, 0.62) },
        { x: cx + w * rnd(0.54, 0.7), y: by - h * rnd(0.22, 0.34) },
        { x: cx + w * rnd(0.48, 0.6), y: by }
      ];
      function body() {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
        ctx.closePath();
      }
      // 石面：受光那侧淡，背光那侧一路压下去
      ctx.save(); body();
      var g = ctx.createLinearGradient(cx - w * 0.6, top, cx + w * 0.5, by);
      g.addColorStop(0, M.hexA('#c8bda6', 0.5));
      g.addColorStop(0.4, M.hexA(INK, 0.2));
      g.addColorStop(1, M.hexA('#2f2b24', 0.44));
      ctx.fillStyle = g; ctx.fill(); ctx.restore();
      // 棱：只走阳面与阴面两条，通圈勾边就成了贴纸
      M.stroke(ctx, pts.slice(0, 6), { w: 1.5, w2: 0.7, alpha: 0.52, profile: 'flat', seg: 2, cap: false, jitter: 0.2, color: M.darken(INK, 0.7) });
      M.stroke(ctx, pts.slice(5), { w: 2.6, w2: 1.1, alpha: 0.6, profile: 'flat', seg: 2, cap: false, dry: 0.42, jitter: 0.25, color: M.darken(INK, 0.85) });
      ctx.save(); body(); ctx.clip();
      // 折带皴：横着折断下来，一路竖着拖是木纹
      for (var c = 0; c < rint(10, 16); c++) {
        var sx = cx + rnd(-w * 0.7, w * 0.62), sy = by - h * rnd(0.15, 0.95);
        var dl = rnd(4, 11), sd = chance(0.7) ? 1 : -1;
        M.stroke(ctx, [{ x: sx, y: sy }, { x: sx + sd * dl, y: sy + rnd(0.5, 2.4) },
          { x: sx + sd * dl * 1.1, y: sy + rnd(2, 6) }],
          { w: rnd(0.7, 1.7), w2: 0.2, alpha: rnd(0.16, 0.42), profile: 'flat', seg: 3,
            color: M.darken(INK, 0.7), cap: false, dry: 0.5 });
      }
      // 凹进去的一块阴面，石头才有向背
      var sh = [{ x: cx + w * 0.06, y: top + h * 0.4 }, { x: cx + w * 0.3, y: top + h * 0.46 },
        { x: cx + w * 0.24, y: by - h * 0.42 }, { x: cx + w * 0.02, y: by - h * 0.56 }];
      ctx.beginPath();
      ctx.moveTo(sh[0].x, sh[0].y);
      for (var s9 = 1; s9 < sh.length; s9++) ctx.lineTo(sh[s9].x, sh[s9].y);
      ctx.closePath();
      ctx.fillStyle = M.colA('#332f28', 0.2); ctx.fill();
      // 阳面留一道亮
      M.wash(ctx, cx - w * 0.34, by - h * 0.6, w * 0.3, h * 0.3, { color: '#f0e8d4', alpha: 0.24 });
      ctx.restore();
      // 苔点：聚在棱上和阴洼里，一路散开是芝麻
      for (var m = 0; m < rint(3, 5); m++) {
        var tp = pts[rint(1, 8)];
        for (var q0 = 0; q0 < rint(3, 6); q0++) {
          M.dot(ctx, tp.x + rnd(-2.4, 2.4), tp.y + rnd(-2, 2.6), rnd(0.5, 1.3),
            { color: chance(0.4) ? GREEN : M.darken(INK, 0.8), alpha: rnd(0.36, 0.66) });
        }
      }
      // 脚下：一道地平把石头顶住，再拖一片影
      var gy = by + rnd(0.5, 2);
      M.stroke(ctx, [{ x: 2, y: gy }, { x: cx + rnd(-4, 4), y: gy + rnd(-0.8, 1.2) }, { x: 98, y: gy + rnd(-1, 1) }],
        { w: 1.4, w2: 0.4, alpha: 0.34, profile: 'flat', seg: 12, dry: 0.5, cap: false });
      M.wash(ctx, cx + w * 0.22, gy + 1.6, w * 1.1, rnd(2.6, 4.2), { color: INK, alpha: 0.2 });
      // 旁边配一块小的，一大一小才成石
      if (chance(0.7)) {
        var sx2 = cx - w * (chance(0.5) ? 1.1 : -1.05), sw = w * rnd(0.3, 0.46), sh2 = sw * rnd(0.8, 1.2);
        var sp = [{ x: sx2 - sw * 0.6, y: gy - 0.4 }, { x: sx2 - sw * 0.5, y: gy - sh2 * 0.6 },
          { x: sx2 + rnd(-sw * 0.1, sw * 0.2), y: gy - sh2 }, { x: sx2 + sw * 0.52, y: gy - sh2 * 0.5 },
          { x: sx2 + sw * 0.6, y: gy - 0.4 }];
        ctx.beginPath();
        ctx.moveTo(sp[0].x, sp[0].y);
        for (var z = 1; z < sp.length; z++) ctx.lineTo(sp[z].x, sp[z].y);
        ctx.closePath();
        ctx.fillStyle = M.colA('#5b554a', 0.28); ctx.fill();
        M.stroke(ctx, sp.slice(0, 4), { w: 1.3, w2: 0.6, alpha: 0.44, profile: 'flat', seg: 2, cap: false, color: M.darken(INK, 0.8) });
        M.wash(ctx, sx2 + sw * 0.2, gy + 1, sw * 0.9, 2, { color: INK, alpha: 0.14 });
      }
      // 石旁一丛草，才不孤零零一块
      if (chance(0.6)) {
        var gx = cx + (chance(0.5) ? -w * 1.15 : w * 1.1);
        for (var q = 0; q < rint(4, 7); q++) {
          var ga = -Math.PI / 2 + rnd(-0.8, 0.8), gl = rnd(7, 16);
          M.stroke(ctx, [{ x: gx + rnd(-2.5, 2.5), y: gy - 0.5 },
            { x: gx + Math.cos(ga) * gl * 0.5, y: gy - 0.5 + Math.sin(ga) * gl * 0.55 },
            { x: gx + Math.cos(ga) * gl, y: gy - 0.5 + Math.sin(ga) * gl }],
            { w: 1.1, w2: 0.15, alpha: rnd(0.36, 0.6), profile: 'taper', seg: 5, cap: false });
        }
      }
      M.air(ctx, cx + rnd(-4, 4), top - rnd(6, 14), 15, 7, {});
    },
    /* ———— 天象 ———— */
    cloud: function (ctx) {
      var n = rint(2, 3);
      for (var i = 0; i < n; i++) {
        cloudMass(ctx, rnd(16, 82), rnd(20, 44), rnd(12, 22), rnd(0.2, 0.32));
      }
      // 云带：几道长抹，压在云团下面接成一片
      cloudBands(ctx, rnd(44, 58), rint(2, 4), { alpha: rnd(0.07, 0.12) });
      // 云隙里露出的山尖——底边一定要化掉
      if (chance(0.65)) {
        var mx = rnd(22, 78), my = rnd(62, 76);
        M.ridge(ctx, mx - 20, mx + 20, my, rnd(10, 18), 7, { alpha: 0.18, lw: 0.6, seed: rnd(0, 6), fade: true });
        M.stroke(ctx, [{ x: mx - rnd(16, 22), y: my - rnd(6, 14) }, { x: mx + rnd(-4, 6), y: my - rnd(16, 24) },
          { x: mx + rnd(14, 22), y: my - rnd(4, 12) }],
          { w: 1.2, w2: 0.5, alpha: 0.34, profile: 'flat', seg: 10, cap: false });
      }
      M.air(ctx, 50, 36, 42, 22, {});
    },

    mist: function (ctx) {
      // 雾用染不用勾：湿笔拖出来的边缘才有牙，一层层横卧的淡抹才是雾
      var y0 = rnd(24, 40);
      for (var i = 0; i < rint(8, 12); i++) {
        var y = y0 + i * rnd(4, 8) + rnd(-2, 2);
        M.wash(ctx, rnd(18, 82), y, rnd(20, 52), rnd(1.8, 4.6), { color: INK, alpha: rnd(0.05, 0.12) });
      }
      // 两三道稍实的雾线压住层次
      for (var k = 0; k < rint(2, 4); k++) {
        var ky = y0 + rnd(4, 50);
        M.stroke(ctx, [{ x: rnd(-10, 16), y: ky }, { x: 50, y: ky - rnd(0, 3) }, { x: rnd(86, 114), y: ky + rnd(-2, 2) }],
          { w: rnd(2.5, 5), w2: rnd(0.8, 2), alpha: rnd(0.06, 0.12), profile: 'swell', seg: 14, jitter: 0.2, cap: false });
      }
      // 雾里露半座山、两梢树——全露就不是雾了
      farHills(ctx, rnd(52, 64), rnd(10, 16), 0.055);
      for (var t = 0; t < rint(1, 3); t++) {
        var tx = rnd(10, 90), ty = rnd(46, 62);
        M.stroke(ctx, [{ x: tx, y: ty + rnd(6, 12) }, { x: tx + rnd(-1, 1), y: ty }],
          { w: 0.9, w2: 0.3, alpha: rnd(0.12, 0.22), profile: 'taper', seg: 4, cap: false });
        foliage(ctx, tx, ty - 1, rnd(3, 5.5), rnd(0.12, 0.2));
      }
      M.wash(ctx, 50, 92, 56, 12, { color: INK, alpha: 0.06 });
    },

    rain: function (ctx) {
      var slant = rnd(0.24, 0.46) * M.sign();
      var y0 = rnd(12, 22);
      // 云：一团压得低低的积墨，上缘勾几个滚圈
      cloudMass(ctx, rnd(30, 70), y0 + rnd(2, 8), rnd(19, 29), rnd(0.2, 0.28));
      cloudBands(ctx, y0 + rnd(11, 17), rint(1, 2), { alpha: 0.08 });
      var top = y0 + 17, bottom = rnd(74, 88);
      // 雨丝：一个方向、一种粗细，靠疏密出层次——乱粗乱细就成了钉子
      for (var r = 0; r < rint(28, 42); r++) {
        var x = rnd(-4, 104);
        var y = top + Math.pow(rnd(0, 1), 0.7) * (bottom - top - 12);
        var len = rnd(8, 16);
        M.stroke(ctx, [{ x: x, y: y }, { x: x - slant * len, y: y + len }],
          { w: rnd(0.35, 0.7), w2: 0.26, alpha: rnd(0.16, 0.36), profile: 'taper', color: BLUE, seg: 3, cap: false });
      }
      // 两三阵密雨，一阵比一阵急
      for (var s0 = 0; s0 < rint(1, 3); s0++) {
        var sx0 = rnd(4, 78), n0 = rint(7, 12);
        for (var k = 0; k < n0; k++) {
          var rx = sx0 + k * rnd(1.5, 3.2), ry = top + rnd(0, (bottom - top) * 0.5);
          var rl = rnd(11, 19);
          M.stroke(ctx, [{ x: rx, y: ry }, { x: rx - slant * rl, y: ry + rl }],
            { w: rnd(0.35, 0.65), w2: 0.25, alpha: rnd(0.2, 0.38), profile: 'taper', color: BLUE, seg: 3, cap: false });
        }
      }
      // 水面：雨点砸出一圈圈的纹
      var wy = bottom + rnd(0, 5);
      ripples(ctx, wy, 96, rint(3, 5), { color: BLUE });
      for (var s = 0; s < rint(9, 16); s++) {
        var px = rnd(4, 96), py = wy + rnd(-1, 14), pr = rnd(1.2, 3.6);
        ctx.save();
        ctx.globalAlpha = rnd(0.18, 0.42);
        ctx.strokeStyle = BLUE; ctx.lineWidth = 0.45;
        ctx.beginPath(); ctx.ellipse(px, py, pr, pr * 0.36, 0, 0, 6.2832); ctx.stroke();
        ctx.restore();
      }
      // 水边一丛低头的水草
      if (chance(0.55)) {
        var gx = chance(0.5) ? rnd(4, 20) : rnd(78, 96);
        for (var g = 0; g < rint(4, 7); g++) {
          var base = wy + rnd(-2, 6);
          taperLeaf(ctx, gx + rnd(-6, 6), base, -Math.PI / 2 + rnd(-0.55, 0.55) - slant,
            rnd(10, 22), rnd(1.4, 2.6), { color: INK, alpha: rnd(0.4, 0.66), bend: rnd(0.1, 0.3) * (gx < 50 ? 1 : -1) });
        }
      }
      M.wash(ctx, 50, (top + bottom) / 2, 54, 30, { color: BLUE, alpha: 0.04 });
    },

    snow: function (ctx) {
      var snowCol = '#f7f3e6';
      // 天：上头一层阴墨，雪才有光
      for (var i = 0; i < rint(3, 5); i++) M.wash(ctx, rnd(10, 90), rnd(4, 24), rnd(26, 46), rnd(9, 18), { color: BLUE, alpha: rnd(0.08, 0.16) });
      // 远山：山是白的，只勾阴面
      var my = rnd(38, 52);
      var ridge = M.ridge(ctx, -4, 104, my, rnd(10, 18), 10, { alpha: 0.12, lw: 0.6, seed: rnd(0, 6), fade: true });
      ctx.save();
      ctx.strokeStyle = M.hexA(INK, 0.3); ctx.lineWidth = 0.6;
      for (var c = 0; c < 7; c++) {
        var p = ridge[rint(1, ridge.length - 2)];
        ctx.beginPath(); ctx.moveTo(p.x, p.y + 1); ctx.lineTo(p.x + rnd(-4, 4), p.y + rnd(5, 11)); ctx.stroke();
      }
      ctx.restore();
      // 坡地：一道雪线，下面淡墨压出体积
      var gy = rnd(62, 74);
      var gp = [{ x: -4, y: gy + rnd(4, 10) }];
      for (var s = 1; s <= 5; s++) gp.push({ x: -4 + 108 * s / 5, y: gy + Math.sin(s * 1.3) * rnd(3, 7) });
      M.stroke(ctx, gp, { w: 1.6, w2: 0.6, alpha: 0.4, profile: 'flat', seg: 13 });
      var sh = gp.slice(); sh.push({ x: 104, y: 104 }); sh.push({ x: -4, y: 104 });
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sh[0].x, sh[0].y);
      for (var q = 1; q < sh.length; q++) ctx.lineTo(sh[q].x, sh[q].y);
      ctx.closePath();
      var gg = ctx.createLinearGradient(0, gy, 0, 104);
      gg.addColorStop(0, M.hexA(INK, 0.16));
      gg.addColorStop(1, M.hexA(INK, 0.03));
      ctx.fillStyle = gg; ctx.fill();
      ctx.restore();
      // 寒林：两三株枯树，枝上压雪
      for (var t = 0; t < rint(2, 4); t++) {
        var tx = rnd(8, 90), ty = gy + rnd(-3, 5), th = rnd(18, 34);
        var lean = rnd(-0.12, 0.12);
        var tr = curve(tx, ty, -Math.PI / 2 + lean, th, 6, -lean * 0.06, 0.08);
        M.stroke(ctx, tr, { w: rnd(1.4, 2.4), w2: 0.4, alpha: 0.72, profile: 'taper', seg: 7, color: M.darken(INK, 0.7), cap: false });
        var tp = M.smooth(tr, 7);
        for (var b = 0; b < rint(3, 5); b++) {
          var bp = tp[rint(Math.round(tp.length * 0.35), tp.length - 1)];
          var ba = -Math.PI / 2 + rnd(-1.1, 1.1);
          var twig = curve(bp.x, bp.y, ba, rnd(7, 14), 5, rnd(-0.1, 0.1), 0.1);
          M.stroke(ctx, twig, { w: 0.9, w2: 0.22, alpha: 0.66, profile: 'taper', seg: 6, cap: false });
          // 雪压枝：沿枝背拖一道白
          M.stroke(ctx, twig.map(function (q) { return { x: q.x, y: q.y - 0.9 }; }),
            { w: 1.3, w2: 0.5, alpha: 0.5, color: snowCol, profile: 'flat', seg: 6, cap: false });
        }
        var cp = tp[tp.length - 1];
        M.wash(ctx, cp.x, cp.y - 1, rnd(3, 6), rnd(1.2, 2.2), { color: snowCol, alpha: 0.5 });
      }
      // 一只寒鸦
      if (chance(0.6)) {
        var bx = rnd(20, 80), by = gy - rnd(16, 34);
        M.blot(ctx, bx, by, 2.6, { alpha: 0.8 });
        M.stroke(ctx, [{ x: bx - 2, y: by }, { x: bx - 7, y: by + 2 }], { w: 1.4, w2: 0.3, alpha: 0.85 });
        M.stroke(ctx, [{ x: bx, y: by + 2 }, { x: bx + 1, y: by + 5 }], { w: 0.7, w2: 0.2, alpha: 0.7 });
      }
      // 落雪：小而虚，勾一圈墨边就成了泡泡
      for (var f = 0; f < rint(30, 50); f++) {
        var fx = rnd(1, 99), fy = rnd(1, 96), fr = rnd(0.4, 1.7);
        M.dot(ctx, fx, fy, fr, { color: snowCol, alpha: rnd(0.5, 0.95) });
        if (chance(0.3)) M.dot(ctx, fx + rnd(-1.6, 1.6), fy + rnd(-1, 1), fr * 0.5, { color: INK, alpha: rnd(0.05, 0.12) });
      }
      // 风卷雪：几道横扫的干笔
      for (var w = 0; w < rint(2, 4); w++) {
        var wy = rnd(20, 88);
        M.stroke(ctx, [{ x: rnd(-4, 20), y: wy }, { x: 50, y: wy - rnd(2, 6) }, { x: rnd(80, 104), y: wy + rnd(-2, 2) }],
          { w: rnd(2, 5), w2: 0.8, alpha: rnd(0.08, 0.16), color: snowCol, profile: 'swell', seg: 12 });
      }
      M.moss(ctx, rnd(20, 70), gy + rnd(6, 16), 4, { spread: 12, min: 0.3, max: 0.8 });
    },

    thunder: function (ctx) {
      var cx = rnd(38, 62), cy = rnd(20, 30), r = rnd(18, 26);
      // 雷先有云：压得低低的一团，云脚要散
      cloudMass(ctx, cx, cy, r * 1.25, 0.24);
      cloudBands(ctx, cy + r * 0.9, rint(1, 2), { alpha: 0.09 });
      var dir = chance(0.5) ? 1 : -1;
      // 雷纹是一只在云底滚动的涡，两三只并排就成了棒棒糖
      var sx = cx + rnd(-r * 0.3, r * 0.3), sy = cy + r * rnd(1.0, 1.25);
      spiral(ctx, sx, sy, rnd(9, 13), rnd(2.2, 2.9), dir,
        { w: rnd(1.6, 2.4), w2: 0.4, alpha: rnd(0.44, 0.6), profile: 'taper', seg: 4, cap: false, color: M.darken(INK, 0.7) });
      if (chance(0.5)) {
        spiral(ctx, sx + dir * rnd(13, 18), sy + rnd(-3, 4), rnd(4, 6.5), rnd(1.6, 2.2), dir,
          { w: 1.2, w2: 0.3, alpha: rnd(0.26, 0.4), profile: 'taper', seg: 4, cap: false, color: M.darken(INK, 0.7) });
      }
      // 声波：从云心往外散开的淡弧，只走一侧，四面围一圈就成了靶
      for (var i = 0; i < rint(3, 4); i++) {
        var rr = r * (1.3 + i * 0.5), a0 = rnd(-0.9, -0.1), span = rnd(1.2, 1.9);
        var arc = [];
        for (var q = 0; q <= 14; q++) {
          var aa = a0 + span * q / 14;
          arc.push({ x: cx + Math.cos(aa) * rr * 1.6, y: cy + Math.sin(aa) * rr });
        }
        M.stroke(ctx, arc, { w: rnd(0.8, 1.5), w2: 0.3, alpha: Math.max(0.04, 0.15 - i * 0.032),
          profile: 'swell', seg: 7, cap: false, dry: 0.4 });
      }
      // 底下急雨：密、斜、长短不齐，雨脚要能看出方向
      var sl = rnd(0.28, 0.5) * dir, wy = rnd(78, 88);
      for (var d = 0; d < rint(30, 46); d++) {
        var rx = rnd(-2, 102), ry = rnd(cy + r * 1.3, wy - 14), rl = rnd(7, 17);
        M.stroke(ctx, [{ x: rx, y: ry }, { x: rx - sl * rl, y: ry + rl }],
          { w: rnd(0.4, 0.7), w2: 0.24, alpha: rnd(0.2, 0.44), profile: 'taper', color: BLUE, seg: 3, cap: false });
      }
      // 雨里一道压地的风，地面砸出浅洼
      cloudBands(ctx, wy - rnd(2, 6), 1, { alpha: 0.08 });
      ripples(ctx, wy, 96, rint(2, 3), { color: BLUE });
      for (var s3 = 0; s3 < rint(5, 9); s3++) {
        var px = rnd(6, 94), pr = rnd(1.2, 3);
        ctx.save();
        ctx.strokeStyle = M.hexA(BLUE, rnd(0.16, 0.34)); ctx.lineWidth = 0.4;
        ctx.beginPath(); ctx.ellipse(px, wy + rnd(0, 12), pr, pr * 0.34, 0, 0, 6.2832); ctx.stroke();
        ctx.restore();
      }
    },

    lightning: function (ctx) {
      var cx = rnd(34, 66), cy = rnd(14, 24), r = rnd(15, 21);
      // 云要压得够黑，电才有地方亮
      cloudMass(ctx, cx, cy, r * 1.15, 0.3);
      cloudMass(ctx, cx + rnd(-r, r), cy + rnd(2, 7), r * 0.7, 0.22);
      // 云心再积一团浓墨，云底抹平：留白的电必须有黑做底
      for (var q0 = 0; q0 < rint(5, 8); q0++) {
        M.wash(ctx, cx + rnd(-r * 0.9, r * 0.9), cy + rnd(-r * 0.3, r * 0.5),
          r * rnd(0.34, 0.7), r * rnd(0.16, 0.34), { color: '#2f2b24', alpha: rnd(0.14, 0.26) });
      }
      cloudBands(ctx, cy + r * rnd(0.75, 1.05), rint(2, 3), { alpha: 0.16, color: '#3a352c' });
      // 主线：细碎地折着往下劈，一大折一拐就成了树枝
      var pts = [{ x: cx + rnd(-4, 4), y: cy + r * 0.5 }];
      var x = pts[0].x, y = pts[0].y, n = rint(7, 10);
      for (var i = 0; i < n; i++) {
        x += rnd(-9, 9); y += rnd(6, 11);
        pts.push({ x: x, y: Math.min(95, y) });
      }
      function bolt(p, mainW) {
        // 先铺一层亮晕，再从亮晕里擦出芯子——电是留白，不是画出来的黑线
        M.stroke(ctx, p, { w: mainW * 5.2, w2: mainW * 2.6, alpha: 0.13, profile: 'swell', seg: 1,
          bleed: 1, color: '#f0e0b4', cap: false });
        M.stroke(ctx, p, { w: mainW * 2.6, w2: mainW * 1.5, alpha: 0.2, profile: 'flat', seg: 1,
          bleed: 0.7, color: '#f6ecd0', cap: false });
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        M.stroke(ctx, p, { w: mainW * 1.15, w2: mainW * 0.8, alpha: 0.95, profile: 'flat', seg: 1 });
        ctx.restore();
        // 只在背光一侧留一丝浓边，两侧都勾就成了管子
        M.stroke(ctx, nudge(p, mainW * 0.85), { w: mainW * 0.34, w2: mainW * 0.16, alpha: 0.42,
          profile: 'flat', seg: 1, cap: false, color: M.darken(INK, 0.5) });
      }
      bolt(pts, 1.5);
      // 分叉：岔出去一两枝细的，才像散开的电
      for (var f = 0; f < rint(1, 3); f++) {
        var fp = pts[rint(2, Math.max(2, n - 2))], sd = chance(0.5) ? 1 : -1;
        var bp = [{ x: fp.x, y: fp.y }], bx = fp.x, by = fp.y;
        for (var m = 0; m < rint(3, 5); m++) {
          bx += sd * rnd(3, 8); by += rnd(5, 10);
          bp.push({ x: bx, y: Math.min(98, by) });
        }
        bolt(bp, 0.8);
      }
      // 电光扫到的地方：几道极短的放射刺
      var mid = pts[Math.round(n * 0.5)];
      for (var z = 0; z < rint(4, 7); z++) {
        var za = rnd(-3.14, 3.14), zl = rnd(3, 8);
        M.stroke(ctx, [{ x: mid.x + Math.cos(za) * 1.6, y: mid.y + Math.sin(za) * 1.6 },
          { x: mid.x + Math.cos(za) * zl, y: mid.y + Math.sin(za) * zl }],
          { w: 0.6, w2: 0.15, alpha: rnd(0.2, 0.42), profile: 'taper', seg: 3, cap: false, color: '#efe2bd' });
      }
      // 云底漏下的雨
      var sl = rnd(0.3, 0.55) * (chance(0.5) ? 1 : -1);
      for (var rr = 0; rr < rint(22, 34); rr++) {
        var rx = rnd(2, 98), ry = rnd(cy + r, 84), rl = rnd(7, 15);
        M.stroke(ctx, [{ x: rx, y: ry }, { x: rx - sl * rl, y: ry + rl }],
          { w: rnd(0.4, 0.62), w2: 0.26, alpha: rnd(0.18, 0.4), profile: 'taper', color: BLUE, seg: 3, cap: false });
      }
      M.wash(ctx, 50, 92, 54, 8, { color: '#6f6a56', alpha: 0.1 });
    },

    rainbow: function (ctx) {
      var cx = rnd(40, 60), cy = rnd(88, 102), r0 = rnd(54, 68);
      var cols = ['#b23a3a', '#bd6f38', '#b19b45', '#4f7a4a', '#3f6a8a', '#57497e'];
      var a0 = Math.PI * 1.03, a1 = Math.PI * 1.97;
      // 虹彩两头要化在雨气里，齐粗通栏的六条带子是儿童画
      for (var i = 0; i < cols.length; i++) {
        var rr = r0 - i * rnd(3.2, 4.6);
        var g = ctx.createLinearGradient(cx - rr, 0, cx + rr, 0);
        g.addColorStop(0, M.hexA(cols[i], 0));
        g.addColorStop(0.2, M.hexA(cols[i], 0.16));
        g.addColorStop(0.5, M.hexA(cols[i], 0.24));
        g.addColorStop(0.8, M.hexA(cols[i], 0.16));
        g.addColorStop(1, M.hexA(cols[i], 0));
        ctx.save();
        ctx.strokeStyle = g;
        ctx.lineWidth = rnd(2.2, 3.6);
        ctx.beginPath(); ctx.arc(cx, cy, rr, a0, a1); ctx.stroke();
        ctx.restore();
      }
      // 虹脚各化一团，才接得住
      M.wash(ctx, cx - r0 * 0.9, cy - 4, rnd(12, 20), rnd(5, 9), { color: INK, alpha: 0.1 });
      M.wash(ctx, cx + r0 * 0.9, cy - 6, rnd(12, 20), rnd(5, 9), { color: INK, alpha: 0.09 });
      // 一边残云、几丝疏雨，虹才有人家
      cloudMass(ctx, rnd(14, 34), rnd(16, 30), rnd(11, 17), 0.18);
      for (var r = 0; r < rint(8, 14); r++) {
        var rx = rnd(6, 40), ry = rnd(30, 66), rl = rnd(6, 13);
        M.stroke(ctx, [{ x: rx, y: ry }, { x: rx - rl * 0.22, y: ry + rl }],
          { w: 0.45, w2: 0.28, alpha: rnd(0.14, 0.3), profile: 'taper', color: BLUE, seg: 3, cap: false });
      }
      farHills(ctx, rnd(84, 94), rnd(7, 12), 0.1);
    },

    sun: function (ctx) {
      var overSea = chance(0.6);
      var x = rnd(28, 66), y = rnd(20, 40), r = rnd(10, 16);
      // 日晕：暖红一层，金一层
      halo(ctx, x, y, r * 1.3, RED, 0.13);
      halo(ctx, x, y, r * 0.7, GOLD, 0.1);
      // 日体：边缘一路淡掉的湿朱，描一圈硬边就成了贴纸
      disc(ctx, x, y, r, '#cf4238', 0.8, chance(0.5) ? 1 : -1);
      if (overSea) {
        var hz = y + r + rnd(14, 26);
        // 海平线一笔
        M.stroke(ctx, [{ x: -2, y: hz }, { x: 52, y: hz - rnd(1, 2) }, { x: 102, y: hz }],
          { w: 1.2, w2: 0.5, alpha: 0.28, profile: 'flat', seg: 14, color: INK, cap: false });
        ripples(ctx, hz + 3, 96, rint(5, 8), { color: BLUE });
        // 波光：正下方一条碎金，一段段断开
        for (var k = 0; k < rint(8, 14); k++) {
          var ry = hz + 3 + k * rnd(2.2, 3.6);
          var rw = r * rnd(0.3, 0.9) * (1 - k / 18);
          var rcx = x + rnd(-r * 0.5, r * 0.5);
          M.stroke(ctx, [{ x: rcx - rw, y: ry }, { x: rcx + rw, y: ry + rnd(-0.6, 0.6) }],
            { w: rnd(0.8, 1.6), w2: 0.3, alpha: Math.max(0.06, rnd(0.14, 0.3) - k * 0.012), color: k % 3 ? '#c7743a' : GOLD, profile: 'flat', seg: 5, cap: false });
        }
        cloudBands(ctx, y + rnd(-6, 4), rint(2, 3), { alpha: rnd(0.08, 0.13) });
        // 两三只鸟掠过日前
        for (var b = 0; b < rint(2, 4); b++) {
          var bx = x + rnd(-r * 2.6, r * 2.6), by = y + rnd(-r * 0.6, r * 1.4), s = rnd(2.6, 4.6);
          M.stroke(ctx, [{ x: bx - s, y: by + s * 0.3 }, { x: bx, y: by - s * 0.34 }, { x: bx + s, y: by + s * 0.26 }],
            { w: 1, w2: 0.3, alpha: 0.72, profile: 'taper', seg: 7, cap: false });
        }
      } else {
        // 山上日出：云气绕日，远山压底
        cloudBands(ctx, y + r * 0.7, rint(3, 5), { alpha: rnd(0.08, 0.14) });
        var hy = y + r + rnd(26, 38);
        farHills(ctx, hy, rnd(10, 16), 0.13);
        // 山脊上一排疏林，只露个尖
        for (var i = 0; i < rint(3, 6); i++) {
          var px = rnd(6, 94), py = hy - rnd(1, 7);
          var ph = rnd(5, 12);
          M.stroke(ctx, [{ x: px, y: py + 1 }, { x: px + rnd(-0.8, 0.8), y: py - ph }],
            { w: rnd(0.6, 1.3), w2: 0.2, alpha: rnd(0.28, 0.5), profile: 'taper', seg: 3, cap: false });
          foliage(ctx, px, py - ph, rnd(2, 4), rnd(0.25, 0.45));
        }
        M.air(ctx, rnd(20, 70), hy - 8, 34, 16, {});
      }
    },

    moon: function (ctx) {
      var x = rnd(30, 62), y = rnd(16, 32), r = rnd(11, 17);
      var crescent = chance(0.5);
      // 夜色：以月为心的雾光，中心自然留白
      halo(ctx, x, y, r, BLUE, 0.16);
      halo(ctx, x, y, r * 1.5, INK, 0.08);
      ctx.save();
      // 月体：一层极淡的暖白，边缘化开——勾整圈墨边就是一个铁环
      disc(ctx, x, y, r, '#f7f0da', 0.62, 0);
      if (crescent) {
        // 亏出的那一部分：用夜色盖回
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'rgba(60,70,86,.18)';
        ctx.beginPath(); ctx.arc(x + r * 0.46, y - r * 0.16, r * 0.94, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
      // 只在亮的一侧补一丝若隐若现的边
      ctx.save();
      ctx.strokeStyle = M.hexA('#efe6cd', 0.5);
      ctx.lineWidth = 0.7;
      var ra = rnd(0, 6.28);
      ctx.beginPath(); ctx.arc(x, y, r * 0.99, ra, ra + rnd(1.2, 2.4)); ctx.stroke();
      ctx.restore();
      // 月中阴影：两三笔淡皴
      for (var i = 0; i < 3; i++) {
        M.blade(ctx, x - r * 0.5 + rnd(0, r), y + rnd(-r * 0.4, r * 0.4), x + rnd(0, r * 0.6), y + rnd(0, r * 0.5), rnd(0.8, 2.2),
          { color: INK, alpha: rnd(0.07, 0.14) });
      }
      // 云破月来：两道云从月前掠过，避开圆心
      cloudBands(ctx, y + rnd(2, 9), rint(2, 3), { alpha: rnd(0.1, 0.17), skip: x + r * 1.4 });
      // 地平远山与水面
      var hz = y + r * 2.4 + rnd(24, 36);
      farHills(ctx, hz, rnd(9, 15), 0.12);
      ripples(ctx, hz + rnd(3, 8), 98, rint(4, 7), { color: BLUE });
      // 月光一条落水
      for (var k = 0; k < rint(5, 9); k++) {
        var ry = hz + 4 + k * rnd(2.6, 4.4);
        var rw = r * (1.1 - k * 0.09) * rnd(0.5, 1.1);
        var mcx = x + rnd(-r * 0.4, r * 0.4);
        M.stroke(ctx, [{ x: mcx - rw, y: ry }, { x: mcx + rw, y: ry + rnd(-0.8, 0.8) }],
          { w: rnd(1, 2), w2: 0.4, alpha: rnd(0.06, 0.14), color: '#f6edd8', profile: 'flat', seg: 6, cap: false });
      }
      // 归鸟两点
      if (chance(0.6)) {
        for (var b = 0; b < rint(2, 3); b++) {
          var bx = x + rnd(-r * 3, r * 2.4), by = y + rnd(r * 1.2, r * 2.6);
          var s = rnd(3, 5.4);
          M.stroke(ctx, [{ x: bx - s, y: by + s * 0.3 }, { x: bx, y: by - s * 0.3 }, { x: bx + s, y: by + s * 0.28 }],
            { w: 1.1, w2: 0.35, alpha: 0.7, profile: 'taper', seg: 7 });
        }
      }
    },

    star: function (ctx) {
      // 星：四道由粗到细的芒，中间一点亮；等粗的十字只会写成加号
      function sparkle(x, y, r, tilt) {
        M.wash(ctx, x, y, r * 1.6, r * 1.6, { color: '#f6efdc', alpha: 0.24 });
        for (var i = 0; i < 8; i++) {
          var main = i % 2 === 0;
          var a = tilt + i * Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
          var L = r * (main ? 1 : 0.5);
          // 芒只往外放：两头都伸、根部又粗，就成了一个墨十字
          M.stroke(ctx, [{ x: x + ca * r * 0.14, y: y + sa * r * 0.14 },
                         { x: x + ca * L * 0.62 - sa * r * 0.04, y: y + sa * L * 0.62 + ca * r * 0.04 },
                         { x: x + ca * L, y: y + sa * L }],
            { w: r * (main ? 0.19 : 0.12), w2: r * 0.015, alpha: main ? 0.74 : 0.4,
              color: INK, profile: 'taper', seg: 7, cap: false });
        }
        M.dot(ctx, x, y, r * 0.13, { color: INK, alpha: 0.9 });
      }
      // 夜空：几层极淡的横晕，星才不贴在白纸上
      for (var w0 = 0; w0 < 4; w0++) {
        M.wash(ctx, rnd(20, 80), 14 + w0 * 16, rnd(38, 58), rnd(7, 13), { color: BLUE, alpha: rnd(0.035, 0.06) });
      }
      var n = rint(3, 5);
      for (var i = 0; i < n; i++) {
        sparkle(rnd(14, 86), rnd(12, 58), rnd(4.5, 8), rnd(-0.35, 0.35));
      }
      // 碎点：密处聚成一道河，疏处零落几颗
      var gx = rnd(20, 70), gy = rnd(20, 50), ga = rnd(-0.5, 0.5);
      for (var d = 0; d < rint(26, 44); d++) {
        var t = rnd(-1, 1);
        var px = gx + t * 34 + rnd(-4, 4), py = gy + t * 34 * Math.sin(ga) + rnd(-4.5, 4.5) * (1 - Math.abs(t) * 0.4);
        if (px < 3 || px > 97 || py < 5 || py > 72) continue;
        M.dot(ctx, px, py, rnd(0.3, 0.95), { color: INK, alpha: rnd(0.28, 0.72) });
      }
      for (var f = 0; f < rint(8, 14); f++) {
        M.dot(ctx, rnd(6, 94), rnd(8, 70), rnd(0.3, 0.8), { color: INK, alpha: rnd(0.2, 0.5) });
      }
      // 偶有一颗拖着尾巴
      if (chance(0.5)) {
        var sx = rnd(20, 70), sy = rnd(14, 40), sl = rnd(14, 26);
        M.stroke(ctx, [{ x: sx, y: sy }, { x: sx + sl, y: sy + sl * rnd(0.3, 0.6) }],
          { w: 1.1, w2: 0.05, alpha: 0.55, color: INK, profile: 'taper', seg: 8, cap: false });
        M.dot(ctx, sx, sy, 1.1, { color: INK, alpha: 0.85 });
      }
      farHills(ctx, rnd(78, 88), 9, 0.12, INK);
    },

    sky: function (ctx) {
      // 天：一整片敞开的空。几道等距的横线是电线，不是天
      var hy = rnd(70, 82);
      for (var i = 0; i < 4; i++) {
        M.wash(ctx, rnd(40, 62), rnd(14, 30) + i * 7, rnd(46, 64), rnd(13, 21), { color: BLUE, alpha: 0.065 });
      }
      M.wash(ctx, 50, 6, 56, 11, { color: '#7f96a8', alpha: 0.09 });
      // 云两团，松的，压在天边
      cloudMass(ctx, rnd(18, 40), rnd(28, 44), rnd(12, 20), 0.1);
      if (chance(0.75)) cloudMass(ctx, rnd(60, 84), rnd(16, 32), rnd(9, 15), 0.08);
      // 远山一道压住天脚，天才有下沿
      farHills(ctx, hy, rnd(7, 12), 0.14, INK);
      M.stroke(ctx, [{ x: 4, y: hy }, { x: 52, y: hy - rnd(1, 3) }, { x: 96, y: hy + rnd(-2, 2) }],
        { w: 1.6, w2: 0.4, alpha: 0.3, color: INK, profile: 'flat', seg: 15, dry: 0.4, cap: false });
      // 几只鸟，大小高低都不齐
      for (var b = 0; b < rint(2, 4); b++) {
        flyBird(ctx, rnd(22, 78), rnd(16, 40), rnd(5, 11), { alpha: rnd(0.4, 0.7), fork: rnd(0.1, 0.4) });
      }
      // 一轮淡日，多半被云遮着
      if (chance(0.55)) {
        var sx = rnd(22, 76), sy = rnd(14, 28);
        disc(ctx, sx, sy, rnd(5, 8), GOLD, 0.32, chance(0.5) ? 1 : -1);
        if (chance(0.6)) cloudMass(ctx, sx + rnd(-8, 8), sy + rnd(-2, 4), rnd(9, 14), 0.07);
      }
      M.air(ctx, rnd(60, 88), rnd(12, 24), 18, 9, {});
    },

    earth: function (ctx) {
      // 地：脚下这一片。涂一块灰方是墙，得有天脚、垄沟和草
      var y = rnd(50, 62);
      M.wash(ctx, 50, y - 20, 52, 13, { color: BLUE, alpha: 0.05 });
      farHills(ctx, y - 3, rnd(6, 10), 0.13);
      // 地平一线，中间走两笔干湿不同的
      M.stroke(ctx, [{ x: 2, y: y }, { x: 44, y: y - rnd(1, 3) }, { x: 98, y: y + rnd(-2, 2) }],
        { w: 1.9, w2: 0.5, alpha: 0.42, color: INK, profile: 'flat', seg: 16, dry: 0.4, cap: false });
      M.stroke(ctx, [{ x: 6, y: y + 1.4 }, { x: 56, y: y + 0.4 }, { x: 94, y: y + 1.8 }],
        { w: 1.1, w2: 0.3, alpha: 0.2, color: INK, profile: 'flat', seg: 16, dry: 0.6, cap: false });
      // 土：地平以下一层层湿黄，越下越沉，边缘全洇开
      for (var i = 0; i < 5; i++) {
        M.wash(ctx, rnd(28, 72), y + 5 + i * rnd(5, 8), rnd(38, 58), rnd(5, 9),
          { color: i % 2 ? '#a9997a' : '#8b7f68', alpha: 0.11 - i * 0.014 });
      }
      // 土的质地：一小撮一小撮横卧的短皴，越近越长越重。通栏的竖线是电线
      for (var k = 0; k < rint(34, 52); k++) {
        var ty = y + 2 + Math.pow(rnd(0, 1), 0.72) * (97 - y);
        var near = (ty - y) / (97 - y);
        var tx = rnd(2, 98), tl = rnd(2, 4) + near * rnd(3, 9);
        M.stroke(ctx, [{ x: tx, y: ty }, { x: tx + tl, y: ty + rnd(-0.9, 1.4) }],
          { w: rnd(0.5, 0.9) + near * 0.7, w2: 0.2, alpha: rnd(0.1, 0.2) + near * 0.12,
            color: chance(0.3) ? '#6f6553' : '#8b7f68', profile: 'flat', seg: 5, dry: 0.6, cap: false });
      }
      // 两三道干裂，主裂带一支小岔
      for (var c3 = 0; c3 < rint(2, 4); c3++) {
        var cxx = rnd(12, 84), cyy = y + rnd(8, 34), cp = [{ x: cxx, y: cyy }];
        var pa = rnd(0.1, 0.5) * (chance(0.5) ? 1 : -1);
        for (var q2 = 0; q2 < rint(3, 6); q2++) {
          pa += rnd(-0.4, 0.4);
          cxx += Math.cos(pa) * rnd(3, 7); cyy += Math.sin(pa) * rnd(1.4, 3.4) + rnd(0.2, 1.4);
          cp.push({ x: cxx, y: Math.min(96, cyy) });
        }
        M.stroke(ctx, cp, { w: rnd(0.7, 1.2), w2: 0.15, alpha: rnd(0.2, 0.34), color: '#4f4a3e',
          profile: 'taper', seg: 8, dry: 0.72, cap: false });
      }
      // 前景一道缓坡，脚下才踩得住实地
      if (chance(0.7)) {
        var mx2 = rnd(20, 80), my2 = rnd(84, 94), mw = rnd(18, 34);
        var mp = [{ x: mx2 - mw, y: my2 + 4 }];
        for (var q3 = 1; q3 <= 6; q3++) {
          mp.push({ x: mx2 - mw + mw * 2 * q3 / 6, y: my2 - Math.sin(q3 / 6 * Math.PI) * rnd(4, 8) + rnd(-1, 1) });
        }
        mp.push({ x: mx2 + mw, y: my2 + 4 });
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(mp[0].x, 99);
        for (var i3 = 0; i3 < mp.length; i3++) ctx.lineTo(mp[i3].x, mp[i3].y);
        ctx.lineTo(mp[mp.length - 1].x, 99); ctx.closePath();
        ctx.fillStyle = M.colA('#8b7f68', 0.2); ctx.fill();
        ctx.restore();
        M.stroke(ctx, mp, { w: 1.3, w2: 0.4, alpha: 0.3, color: '#5c5344', profile: 'flat', seg: 8, dry: 0.55, cap: false });
      }
      // 草撮与碎石
      for (var g = 0; g < rint(6, 11); g++) {
        var gx = rnd(6, 94), gy = y + rnd(3, 30), gh = rnd(3, 9);
        M.stroke(ctx, [{ x: gx, y: gy }, { x: gx + rnd(-2, 2), y: gy - gh }],
          { w: 0.9, w2: 0.15, alpha: rnd(0.24, 0.5), profile: 'taper', seg: 5, dry: 0.5, cap: false });
      }
      for (var s2 = 0; s2 < rint(1, 3); s2++) M.blot(ctx, rnd(12, 88), y + rnd(6, 28), rnd(1.6, 3.4), { color: '#6d6557', alpha: 0.34 });
      // 一株新苗，地才不是死的
      if (chance(0.7)) {
        var mx = rnd(20, 78), my = y + rnd(8, 22);
        M.stroke(ctx, [{ x: mx, y: my }, { x: mx, y: my - rnd(6, 10) }], { w: 1.1, w2: 0.5, alpha: 0.5, color: '#5d6a45', profile: 'flat', seg: 5, cap: false });
        taperLeaf(ctx, mx, my - 7, rnd(-2.6, -2.2), rnd(5, 8), 1.6, { color: '#5d6a45', alpha: 0.5, bend: 0.25 });
        taperLeaf(ctx, mx, my - 7, rnd(-0.6, -0.2), rnd(5, 8), 1.6, { color: '#5d6a45', alpha: 0.45, bend: 0.25 });
      }
      M.air(ctx, rnd(14, 86), y - rnd(24, 34), 18, 8, {});
    },

    fire: function (ctx) {
      // 火：底下有柴，上面有苗，苗分三层还要歪。一根棍加几点是火把
      var x = rnd(42, 58), y = rnd(66, 78), hh = rnd(26, 40), lean = rnd(-0.34, 0.34);
      M.wash(ctx, x, y - hh * 0.4, hh * 1.2, hh * 0.85, { color: '#c8743a', alpha: 0.08 });
      halo(ctx, x + lean * hh * 0.3, y - hh * 0.45, hh * 0.4, '#d98b45', 0.12);
      // 柴：两三根交叉压在底下，末端一点焦
      for (var l = 0; l < rint(2, 4); l++) {
        var la = rnd(2.5, 3.7), ld = hh * rnd(0.3, 0.46);
        M.stroke(ctx, [{ x: x + Math.cos(la) * ld, y: y + rnd(0, 4) }, { x: x - Math.cos(la) * ld, y: y + rnd(2, 6) }],
          { w: rnd(2, 3.4), w2: rnd(1, 2), alpha: 0.62, color: '#4a3a2c', profile: 'flat', seg: 6, dry: 0.4, cap: false });
        M.dot(ctx, x - Math.cos(la) * ld, y + rnd(2, 6), rnd(0.9, 1.6), { color: '#2b241d', alpha: 0.5 });
      }
      // 外苗：三四舌，长短歪斜，湿红
      var tg = rint(3, 5);
      for (var t = 0; t < tg; t++) {
        var tx = x + rnd(-hh * 0.2, hh * 0.2), th = hh * rnd(0.5, 1.0), tw = th * rnd(0.2, 0.3);
        var tp = [{ x: tx, y: y - rnd(0, 3) }, { x: tx + lean * th * 0.5 + rnd(-2, 2), y: y - th * 0.55 }, { x: tx + lean * th, y: y - th }];
        M.stroke(ctx, tp, { w: tw, w2: 0.7, alpha: rnd(0.42, 0.62), color: t === 0 ? '#8a2f26' : '#b5432f',
          profile: 'swell', seg: 8, dry: 0.35, bleed: 0.5, cap: true });
      }
      // 芯：一笔淡黄压在最里，火才亮起来
      M.stroke(ctx, [{ x: x, y: y - hh * 0.12 }, { x: x + lean * hh * 0.4, y: y - hh * 0.55 }, { x: x + lean * hh * 0.62, y: y - hh * 0.78 }],
        { w: hh * 0.13, w2: 0.6, alpha: 0.5, color: '#f2d492', profile: 'taper', seg: 7, cap: true });
      // 舔上来的小苗，主苗旁边分一星
      if (chance(0.7)) {
        var bx = x + rnd(-hh * 0.4, hh * 0.4), bh = hh * rnd(0.2, 0.4);
        M.stroke(ctx, [{ x: bx, y: y - 2 }, { x: bx + rnd(-2, 2), y: y - bh }],
          { w: bh * 0.34, w2: 0.4, alpha: 0.5, color: '#c25a34', profile: 'swell', seg: 5, cap: true });
      }
      // 烟：一笔灰青直上去散掉
      M.stroke(ctx, [{ x: x + lean * hh, y: y - hh * 0.9 }, { x: x + lean * hh * 1.6 + rnd(-4, 4), y: y - hh * 1.5 },
        { x: x + lean * hh * 1.2 + rnd(-8, 8), y: y - hh * 2.1 }],
        { w: 2.6, w2: 0.2, alpha: 0.16, color: '#6a6560', profile: 'taper', seg: 10, dry: 0.7, cap: false });
      // 火星几点，往上飘
      for (var e2 = 0; e2 < rint(4, 8); e2++) {
        M.dot(ctx, x + rnd(-hh * 0.6, hh * 0.6) + lean * hh * 0.4, y - rnd(hh * 0.4, hh * 1.7), rnd(0.4, 1.1),
          { color: chance(0.5) ? '#e08a4a' : '#a33a2c', alpha: rnd(0.4, 0.8) });
      }
      // 地上受光一片
      M.wash(ctx, x + rnd(-4, 8), y + 6, hh * 0.8, 3.5, { color: '#d9a05a', alpha: 0.16 });
      M.splatter(ctx, x, y - hh * 0.3, hh * 0.7, 8, { color: '#a33a2c', alpha: 0.3, max: 0.8 });
      M.air(ctx, x + hh, y - hh * 1.4, 14, 8, {});
    },

    light: function (ctx) {
      // 光：一处亮、一片洒出去、地上接住。等距十二根针是个齿轮
      var x = rnd(30, 66), y = rnd(20, 34), r = rnd(6, 10), gy = rnd(64, 78);
      halo(ctx, x, y, r, '#e8d49a', 0.3);
      disc(ctx, x, y, r, '#f6e7bd', 0.52, 1);
      // 芒：疏密不等、长短不齐，偶尔一道特别长
      var n = rint(9, 13), a0 = rnd(0, 6.28);
      for (var i = 0; i < n; i++) {
        var a = a0 + i / n * 6.2832 + rnd(-0.13, 0.13);
        var r1 = r * rnd(1.5, 3) * (chance(0.18) ? rnd(1.5, 2.1) : 1);
        M.stroke(ctx, [{ x: x + Math.cos(a) * r * 1.12, y: y + Math.sin(a) * r * 1.12 },
          { x: x + Math.cos(a) * r1, y: y + Math.sin(a) * r1 }],
          { w: rnd(0.8, 1.6), w2: 0.12, alpha: rnd(0.18, 0.42), color: '#8a7a4a', profile: 'taper', seg: 5, dry: 0.5, cap: false });
      }
      // 一束斜洒到地上，边缘别齐
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - r * 0.5, y + r * 0.3);
      ctx.lineTo(x + r * 0.5, y + r * 0.3);
      ctx.lineTo(x + r * 0.5 + rnd(18, 30), gy);
      ctx.lineTo(x - r * 0.5 - rnd(4, 16), gy);
      ctx.closePath();
      ctx.fillStyle = M.colA('#f3e6bf', 0.13); ctx.fill();
      ctx.restore();
      // 地：一道横，光落在上面一块亮
      M.stroke(ctx, [{ x: 6, y: gy }, { x: 52, y: gy + rnd(-1.5, 2) }, { x: 94, y: gy - rnd(0, 2) }],
        { w: 1.6, w2: 0.4, alpha: 0.34, profile: 'flat', seg: 15, dry: 0.45, cap: false });
      M.wash(ctx, x + rnd(-4, 10), gy - 1, rnd(16, 26), 3.5, { color: '#f0dfa8', alpha: 0.2 });
      // 光里浮的尘
      for (var d = 0; d < rint(5, 10); d++) {
        M.dot(ctx, x + rnd(-r * 2.2, r * 2.6), y + rnd(r, gy - y), rnd(0.3, 0.8), { color: '#cbb87a', alpha: rnd(0.25, 0.5) });
      }
      M.air(ctx, x + r * 3.4, y - r, 16, 8, {});
    },

    shadow: function (ctx) {
      // 影：先有个立着的东西，影子才有所来。一团灰加几根针是毛栗子
      var gy = rnd(64, 76), ox = rnd(28, 48), oh = rnd(22, 34), sd = rnd(1.1, 1.9);
      // 地
      M.stroke(ctx, [{ x: 6, y: gy }, { x: 54, y: gy + rnd(-1, 2) }, { x: 94, y: gy - rnd(0, 2) }],
        { w: 1.8, w2: 0.5, alpha: 0.36, profile: 'flat', seg: 15, dry: 0.4, cap: false });
      M.wash(ctx, 50, gy + 8, 46, 7, { color: INK, alpha: 0.06 });
      // 立物：一块石，湿墨压出三面
      var sp = [];
      for (var i = 0; i <= 10; i++) {
        var a = i / 10 * 6.2832;
        var rr = 1 + rnd(-0.12, 0.12);
        sp.push({ x: ox + Math.cos(a) * oh * 0.3 * rr, y: gy - oh * 0.42 + Math.sin(a) * oh * 0.44 * rr });
      }
      var ss = M.smooth(sp, 3);
      ctx.beginPath();
      ctx.moveTo(ss[0].x, ss[0].y);
      for (i = 1; i < ss.length; i++) ctx.lineTo(ss[i].x, ss[i].y);
      ctx.closePath();
      var bg = ctx.createLinearGradient(ox - oh * 0.3, gy - oh, ox + oh * 0.3, gy);
      bg.addColorStop(0, M.colA('#6e675c', 0.6));
      bg.addColorStop(0.6, M.colA('#463f38', 0.68));
      bg.addColorStop(1, M.colA('#25211c', 0.6));
      ctx.fillStyle = bg; ctx.fill();
      M.stroke(ctx, ss.slice(2, 8), { w: 1.6, w2: 0.6, alpha: 0.5, color: '#1f1c18', profile: 'flat', seg: 6, dry: 0.4, cap: false });
      // 影子：从脚底斜拖出去，近实远虚，带一点石的胖瘦
      ctx.save();
      ctx.translate(ox, gy + 1); ctx.rotate(rnd(0.04, 0.14));
      var sl = oh * sd;
      var sg = ctx.createLinearGradient(0, 0, sl, 0);
      sg.addColorStop(0, M.colA('#2a2620', 0.42));
      sg.addColorStop(0.45, M.colA('#2a2620', 0.2));
      sg.addColorStop(1, M.colA('#2a2620', 0.02));
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(0, -oh * 0.06);
      ctx.quadraticCurveTo(sl * 0.4, -oh * 0.16, sl, -oh * 0.03);
      ctx.quadraticCurveTo(sl * 0.6, oh * 0.12, 0, oh * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // 影里几笔拖痕，说明是扫出来的
      for (var k = 0; k < rint(3, 5); k++) {
        var t0 = rnd(0.2, 0.9);
        M.stroke(ctx, [{ x: ox + sl * t0 * 0.9, y: gy + rnd(-2, 3) }, { x: ox + sl * t0 * 0.9 + rnd(4, 12), y: gy + rnd(-1, 4) }],
          { w: 1.2, w2: 0.2, alpha: 0.14, color: '#2a2620', profile: 'taper', seg: 6, dry: 0.6, cap: false });
      }
      // 光来的那边留白，另一侧压暗
      M.wash(ctx, ox - oh * 0.5, gy - oh * 0.5, oh * 0.3, oh * 0.4, { color: '#f4ecd8', alpha: 0.14 });
      if (chance(0.6)) {
        var px = ox + sl * rnd(0.9, 1.3);
        M.stroke(ctx, [{ x: px, y: gy }, { x: px + rnd(-2, 3), y: gy - rnd(4, 9) }],
          { w: 0.9, w2: 0.2, alpha: 0.3, profile: 'taper', seg: 5, dry: 0.5, cap: false });
      }
      M.air(ctx, ox - oh * 1.2, gy - oh * 1.2, 15, 8, {});
    },

    wind: function (ctx) {
      // 风：几道长短干湿都不一样的扫笔，加一片倒向一边的草。四条平行线是电线
      var dir = chance(0.75) ? 1 : -1, y0 = rnd(28, 50);
      var n = rint(3, 5);
      for (var i = 0; i < n; i++) {
        var y = y0 + i * rnd(5, 13) + rnd(-3, 3);
        var x0 = dir > 0 ? rnd(2, 22) : rnd(78, 98);
        var len = rnd(30, 78) * dir, wob = rnd(1.3, 2.8), drp = rnd(-3, 6);
        var pts = [], np = rint(4, 7);
        for (var s = 0; s <= np; s++) {
          var t = s / np;
          pts.push({ x: x0 + len * t, y: y - Math.sin(t * wob + i * 0.8) * rnd(2, 8) * (1 - t * 0.4) - t * drp });
        }
        var col = chance(0.55) ? BLUE : INK;
        M.wash(ctx, x0 + len * 0.5, y - 1, Math.abs(len) * 0.42, rnd(5, 10), { color: col, alpha: 0.055 });
        M.stroke(ctx, pts, { w: rnd(3, 9), w2: rnd(0.3, 1.2), alpha: rnd(0.14, 0.28), profile: 'swell', seg: 12,
          color: col, dry: rnd(0.3, 0.7), bleed: 0.3, cap: false });
        // 起笔那一段压重一丝，风才有力
        M.stroke(ctx, pts.slice(0, Math.max(2, np)), { w: rnd(1.2, 2.2), w2: 0.4, alpha: rnd(0.24, 0.4),
          profile: 'flat', seg: 8, color: col, dry: 0.5, cap: false });
      }
      // 一个旋
      if (chance(0.65)) {
        spiral(ctx, rnd(30, 70), rnd(28, 52), rnd(6, 12), rnd(1, 1.6), dir,
          { w: 2.2, w2: 0.3, alpha: 0.26, color: BLUE, profile: 'taper', seg: 8, dry: 0.5, cap: false });
      }
      // 草：一片倒向一边，长短不齐
      var gy = rnd(72, 84);
      for (var g = 0; g < rint(8, 13); g++) {
        var bx = rnd(4, 96), bh = rnd(7, 20);
        M.stroke(ctx, [{ x: bx, y: gy }, { x: bx + dir * bh * 0.4, y: gy - bh * 0.6 }, { x: bx + dir * bh * rnd(0.7, 1.05), y: gy - bh }],
          { w: 1.1, w2: 0.18, alpha: rnd(0.28, 0.52), profile: 'taper', seg: 7, dry: 0.5, cap: false });
      }
      M.stroke(ctx, [{ x: 4, y: gy }, { x: 96, y: gy + rnd(-1, 2) }], { w: 1.4, w2: 0.3, alpha: 0.24, profile: 'flat', seg: 15, dry: 0.5, cap: false });
      // 卷走的叶两片
      for (var lf = 0; lf < rint(1, 3); lf++) {
        M.petal(ctx, rnd(20, 80), rnd(18, 58), rnd(1.6, 2.8), rnd(1, 1.6), rnd(0, 6.28),
          { color: '#6d7a52', alpha: rnd(0.3, 0.5), edge: false });
      }
      // 尘
      for (var d2 = 0; d2 < rint(6, 12); d2++) {
        var dx = rnd(8, 92), dy = y0 + rnd(-14, 34);
        M.stroke(ctx, [{ x: dx, y: dy }, { x: dx + dir * rnd(4, 15), y: dy - rnd(0, 5) }],
          { w: 0.8, w2: 0.1, alpha: rnd(0.18, 0.4), profile: 'taper', color: BLUE, seg: 4, cap: false });
      }
      M.air(ctx, dir > 0 ? 82 : 18, y0 - 12, 18, 9, {});
    },
    /* ———— 鳞介 ———— */
    fish: function (ctx) {
      // 写意锦鲤：长身、细腰、分叉尾；背一道浓墨，鳍尾只留一层水色
      function koi(x, y, s, ang, col, back) {
        var c = Math.cos(ang), sn = Math.sin(ang), fx = back ? -1 : 1;
        function P(lx, ly) { lx *= fx; return { x: x + lx * c - ly * sn, y: y + lx * sn + ly * c }; }
        var wave = rnd(-0.5, 0.5), amp = rnd(0.05, 0.08);
        var N = 16;
        // 身长 1.5s，最粗 0.25s，到尾柄收成一根细腰——鱼的秀气全在这条收分上
        function hwAt(u) { return 0.05 + 0.2 * Math.sin(Math.PI * Math.pow(u, 0.72)) * (1 - 0.22 * u); }
        var ls = [], lt = [], lb = [];
        for (var i = 0; i <= N; i++) {
          var u = i / N;
          var lx = (-0.5 + 1.5 * u) * s;
          var ly = Math.sin(u * 2.6 + wave) * amp * s * (0.25 + u * 0.9);
          var h = hwAt(u) * s;
          ls.push({ x: lx, y: ly });
          lt.push({ x: lx, y: ly - h });
          lb.push({ x: lx, y: ly + h * 0.94 });
        }
        function fillL(pts, style, edge) {
          ctx.beginPath();
          for (var m = 0; m < pts.length; m++) {
            var q = P(pts[m].x, pts[m].y);
            if (m) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y);
          }
          ctx.closePath();
          ctx.fillStyle = style; ctx.fill();
          if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = Math.max(0.14, s * 0.016); ctx.stroke(); }
        }
        // 鳍：贴着轮廓长出来的一片，前低后高再收回去
        function finShape(edge, u0, u1, hMax, lean, sgn) {
          var out = [], base = [], st = 7;
          for (var a = 0; a <= st; a++) {
            var f = a / st, idx = Math.round((u0 + (u1 - u0) * f) * N);
            out.push({ x: edge[idx].x, y: edge[idx].y + sgn * hMax * s * Math.sin(Math.PI * Math.pow(f, lean)) });
          }
          for (var b = st; b >= 0; b--) {
            var i2 = Math.round((u0 + (u1 - u0) * (b / st)) * N);
            base.push({ x: edge[i2].x, y: edge[i2].y });
          }
          return out.concat(base);
        }
        var dk = M.darken(col, 0.55);
        // 尾：先画在身后，笔根窄、梢上散开，中间咬一个叉
        var ped = ls[N];
        var p0 = P(ped.x, ped.y);
        var uT = P(ped.x + 0.62 * s, ped.y - 0.46 * s), lT = P(ped.x + 0.6 * s, ped.y + 0.44 * s);
        var nt = P(ped.x + 0.3 * s, ped.y);
        ctx.save();
        var tg = ctx.createLinearGradient(p0.x, p0.y, P(ped.x + 0.6 * s, ped.y).x, P(ped.x + 0.6 * s, ped.y).y);
        tg.addColorStop(0, M.hexA(col, 0.6));
        tg.addColorStop(0.45, M.hexA(col, 0.4));
        tg.addColorStop(1, M.hexA(col, 0.05));
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(P(ped.x + 0.36 * s, ped.y - 0.3 * s).x, P(ped.x + 0.36 * s, ped.y - 0.3 * s).y, uT.x, uT.y);
        ctx.quadraticCurveTo(P(ped.x + 0.44 * s, ped.y - 0.06 * s).x, P(ped.x + 0.44 * s, ped.y - 0.06 * s).y, nt.x, nt.y);
        ctx.quadraticCurveTo(P(ped.x + 0.44 * s, ped.y + 0.08 * s).x, P(ped.x + 0.44 * s, ped.y + 0.08 * s).y, lT.x, lT.y);
        ctx.quadraticCurveTo(P(ped.x + 0.36 * s, ped.y + 0.28 * s).x, P(ped.x + 0.36 * s, ped.y + 0.28 * s).y, p0.x, p0.y);
        ctx.fillStyle = tg; ctx.fill();
        ctx.strokeStyle = M.hexA(dk, 0.2);
        ctx.lineWidth = Math.max(0.12, s * 0.012);
        for (var k = 0; k < 6; k++) {
          var aa = -0.42 + k * 0.165;
          var rq = P(ped.x + s * (0.52 - Math.abs(aa) * 0.34), ped.y + aa * s);
          ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(rq.x, rq.y); ctx.stroke();
        }
        ctx.restore();
        // 臀鳍：尾根底下一小片
        fillL(finShape(lb, 0.76, 0.94, 0.13, 1.4, 1), M.hexA(col, 0.34));
        // 一团水气垫底
        M.wash(ctx, x, y, s * 1.15, s * 0.55, { color: col, alpha: 0.08 });
        // 身：背浓腹淡，肚皮收成一抹奶白
        var T = M.smooth(lt, 5), B = M.smooth(lb, 5);
        ctx.save();
        var g = ctx.createLinearGradient(P(0, -0.3 * s).x, P(0, -0.3 * s).y, P(0, 0.3 * s).x, P(0, 0.3 * s).y);
        g.addColorStop(0, M.colA(dk, 0.82));
        g.addColorStop(0.4, M.hexA(col, 0.55));
        g.addColorStop(0.78, M.hexA(col, 0.3));
        g.addColorStop(1, M.hexA('#f7efdc', 0.42));
        ctx.beginPath();
        for (var a1 = 0; a1 < T.length; a1++) { var qa = P(T[a1].x, T[a1].y); if (a1) ctx.lineTo(qa.x, qa.y); else ctx.moveTo(qa.x, qa.y); }
        for (var b1 = B.length - 1; b1 >= 0; b1--) { var qb = P(B[b1].x, B[b1].y); ctx.lineTo(qb.x, qb.y); }
        ctx.closePath(); ctx.fillStyle = g; ctx.fill();
        ctx.restore();
        // 背鳍：低低一道，压在背上
        fillL(finShape(lt, 0.34, 0.68, 0.16, 1.5, -1), M.hexA(col, 0.4), M.hexA(dk, 0.22));
        // 胸鳍：鳃后斜斜一撇
        var pc = P(ls[4].x, ls[4].y + hwAt(0.25) * s * 0.4), pt = P(ls[4].x + 0.36 * s, ls[4].y + 0.3 * s);
        M.blade(ctx, pc.x, pc.y, pt.x, pt.y, s * 0.15,
          { color: col, alpha: 0.4, bulge: 1.3, tip: M.hexA(col, 0.05) });
        // 背线：一笔浓墨走到底，带飞白
        var bk = [];
        for (var bi = 1; bi < 12; bi++) bk.push(P(lt[bi].x, lt[bi].y));
        M.stroke(ctx, bk, { w: s * 0.075, w2: s * 0.02, alpha: 0.82, color: dk, profile: 'taper', seg: 10, dry: 0.45 });
        // 花斑：两三块化开的浓色，横过背脊
        for (var d = 0; d < rint(2, 3); d++) {
          var di = rint(4, 11), dp = ls[di];
          M.wash(ctx, P(dp.x, dp.y - hwAt(di / N) * s * 0.3).x, P(dp.x, dp.y - hwAt(di / N) * s * 0.3).y,
            s * rnd(0.16, 0.26), s * rnd(0.1, 0.16), { color: dk, alpha: rnd(0.3, 0.5) });
        }
        var wi = rint(5, 10), wp = ls[wi];
        M.wash(ctx, P(wp.x, wp.y + hwAt(wi / N) * s * 0.4).x, P(wp.x, wp.y + hwAt(wi / N) * s * 0.4).y,
          s * 0.24, s * 0.12, { color: '#f7efdc', alpha: 0.55 });
        // 鳃：一道弧；鳃后一点浓
        M.stroke(ctx, [P(ls[3].x, lt[3].y + 0.02 * s), P(ls[3].x + 0.04 * s, ls[3].y), P(ls[3].x, lb[3].y - 0.02 * s)],
          { w: s * 0.03, w2: s * 0.01, alpha: 0.42, color: dk, profile: 'taper', seg: 7 });
        // 眼：浓点加一线高光，周围一抹白晕，不圈成一副眼镜
        var ep = P(ls[2].x, ls[2].y - hwAt(2 / N) * s * 0.34);
        M.wash(ctx, ep.x, ep.y, s * 0.075, s * 0.06, { color: '#f8f1e0', alpha: 0.5 });
        M.dot(ctx, ep.x, ep.y, s * 0.03, { color: M.darken(col, 0.3), alpha: 0.92 });
        M.dot(ctx, ep.x - s * 0.01, ep.y - s * 0.01, s * 0.01, { color: '#f8f1e0', alpha: 0.8 });
        // 口与须：须只顺水拖一丝，不立成两根天线
        M.stroke(ctx, [P(ls[0].x + 0.02 * s, ls[0].y + 0.03 * s), P(ls[0].x + 0.12 * s, ls[0].y + 0.1 * s)],
          { w: s * 0.024, w2: s * 0.008, alpha: 0.48, color: dk, profile: 'flat', seg: 5 });
        for (var w2i = 0; w2i < 2; w2i++) {
          var sgn = w2i ? 1 : -1;
          M.stroke(ctx, [P(ls[0].x + 0.02 * s, sgn * 0.04 * s), P(ls[0].x - 0.2 * s, sgn * 0.1 * s), P(ls[0].x - 0.36 * s, sgn * 0.16 * s)],
            { w: s * 0.018, w2: 0.08, alpha: 0.24, color: dk, profile: 'taper', seg: 9, dry: 0.5 });
        }
      }

      // 水面先铺两层
      M.wash(ctx, rnd(38, 62), rnd(34, 58), 46, 26, { color: BLUE, alpha: 0.07 });
      for (var l = 0; l < rint(4, 7); l++) {
        var ly = rnd(8, 92), lx = rnd(-4, 44), ll = rnd(16, 40);
        M.stroke(ctx, [{ x: lx, y: ly }, { x: lx + ll * 0.5, y: ly + rnd(-2, 2) }, { x: lx + ll, y: ly + rnd(-1, 1) }],
          { w: rnd(1.4, 3.4), w2: 0.5, alpha: rnd(0.05, 0.12), color: BLUE, profile: 'swell', seg: 12 });
      }
      // 鱼：身长近两倍 s，槽位要按身长留，一条一个位置，别叠成一群
      // 朝向只靠 back 镜像；ang 转 180° 会把肚皮翻上来
      var n = rint(2, 3);
      var pal = ['#b8342b', '#cf7a2e', '#3c3a34', '#a9713a'];
      var where = [];
      for (var i = 0; i < n; i++) {
        var s = rnd(14, 18) - i * 1.1;
        var slot = 14 + (72 / n) * (i + 0.5) + rnd(-8, 8);
        var wx = clamp(slot, 1.1 * s + 6, 94 - 1.1 * s), wy = clamp(rnd(26, 74) + (i % 2 ? rnd(0, 14) : rnd(-14, 0)), 22, 82);
        var back = chance(0.5);
        where.push({ x: wx, y: wy, s: s });
        koi(wx, wy, s, rnd(-0.4, 0.4), pal[(i + rint(0, 3)) % pal.length], back);
      }
      // 浮萍：只在角落聚几片，不在水心乱点
      for (var p = 0; p < rint(1, 3); p++) {
        var gx = chance(0.5) ? rnd(4, 20) : rnd(76, 94), gy = rnd(66, 94);
        for (var q = 0; q < rint(3, 6); q++) {
          M.dot(ctx, gx + rnd(-5, 5), gy + rnd(-3, 3), rnd(0.8, 1.8),
            { color: chance(0.4) ? '#4a5b34' : GREEN, alpha: rnd(0.26, 0.46) });
        }
      }
      // 涟漪：只绕着鱼身下方，断开的两段弧
      for (var r = 0; r < rint(1, 3); r++) {
        var f0 = where[rint(0, where.length - 1)];
        var rx = f0.x + rnd(-f0.s * 0.6, f0.s * 0.6), ry = f0.y + f0.s * rnd(0.5, 1.1);
        var rr = f0.s * rnd(0.7, 1.2);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = M.hexA(INK, rnd(0.12, 0.22));
        ctx.lineWidth = rnd(0.4, 0.7);
        ctx.beginPath(); ctx.ellipse(rx, ry, rr, rr * 0.28, rnd(-0.15, 0.15), 3.5, 5.6); ctx.stroke();
        ctx.strokeStyle = M.hexA(INK, rnd(0.08, 0.16));
        ctx.beginPath(); ctx.ellipse(rx, ry, rr * 0.9, rr * 0.25, 0, 0.4, 2.4); ctx.stroke();
        ctx.restore();
      }
      // 水底一层淡青，鱼才浮得起来
      M.wash(ctx, 50, 82, 50, 16, { color: BLUE, alpha: 0.08 });
    },

    bird: function (ctx) {
      // 一只栖枝的写意雀：湿墨一团 + 浓墨点头 + 三笔尾 + 细腿
      function perched(x, y, s, dir) {
        var body = { x: x, y: y };
        // 身：一次淡墨铺底 + 一次主墨
        M.wash(ctx, body.x, body.y, s * 1.5, s * 1.05, { color: INK, alpha: 0.12 });
        ctx.save();
        ctx.translate(body.x, body.y);
        ctx.scale(dir, 1);
        ctx.rotate(rnd(-0.25, 0.15));
        var g = ctx.createRadialGradient(s * 0.2, -s * 0.15, s * 0.06, 0, 0, s * 1.05);
        g.addColorStop(0, M.hexA(INK, 0.86));
        g.addColorStop(0.6, M.hexA(INK, 0.55));
        g.addColorStop(1, M.hexA(INK, 0.1));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.82, s * 0.55, -0.15, 0, 6.2832); ctx.fill();
        // 头
        var hx = s * 0.72, hy = -s * 0.42, hr = s * 0.34;
        ctx.fillStyle = M.hexA(INK, 0.9);
        ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 6.2832); ctx.fill();
        // 喙
        ctx.beginPath();
        ctx.moveTo(hx + hr * 0.7, hy - hr * 0.15);
        ctx.lineTo(hx + hr * 1.9, hy + hr * 0.18);
        ctx.lineTo(hx + hr * 0.6, hy + hr * 0.5);
        ctx.closePath(); ctx.fill();
        // 眼留白
        ctx.fillStyle = 'rgba(246,240,226,.9)';
        ctx.beginPath(); ctx.arc(hx + hr * 0.18, hy - hr * 0.12, hr * 0.16, 0, 6.2832); ctx.fill();
        // 翅：一笔带飞白
        M.stroke(ctx, [{ x: -s * 0.1, y: -s * 0.2 }, { x: s * 0.25, y: s * 0.02 }, { x: -s * 0.5, y: s * 0.3 }],
          { w: s * 0.34, w2: s * 0.06, alpha: 0.85, color: M.darken(INK, 0.6), profile: 'swell', dry: 0.55, seg: 7 });
        // 尾：三笔
        for (var t = 0; t < 3; t++) {
          M.stroke(ctx, [{ x: -s * 0.6, y: -s * 0.05 }, { x: -s * 1.3 - t * s * 0.16, y: -s * (0.3 + t * 0.16) }],
            { w: s * 0.16, w2: s * 0.03, alpha: rnd(0.6, 0.9), profile: 'taper', seg: 6 });
        }
        ctx.restore();
        // 腿
        M.stroke(ctx, [{ x: body.x - s * 0.12 * dir, y: body.y + s * 0.5 }, { x: body.x - s * 0.1 * dir, y: body.y + s * 0.95 }],
          { w: 0.9, w2: 0.3, alpha: 0.8, profile: 'taper' });
        M.stroke(ctx, [{ x: body.x + s * 0.2 * dir, y: body.y + s * 0.48 }, { x: body.x + s * 0.24 * dir, y: body.y + s * 0.95 }],
          { w: 0.9, w2: 0.3, alpha: 0.8, profile: 'taper' });
      }

      var flying = chance(0.4);
      if (flying) {
        // 两只掠过的鸟：两笔一张翅
        for (var i = 0; i < rint(2, 3); i++) {
          var bx = rnd(18, 78), by = rnd(16, 52), bs = rnd(7, 13);
          var flap = rnd(-0.4, 0.5);
          M.stroke(ctx, [{ x: bx - bs, y: by + flap * bs }, { x: bx - bs * 0.3, y: by - bs * 0.35 }, { x: bx, y: by }],
            { w: 1.8, w2: 0.5, alpha: 0.8, profile: 'taper', seg: 6 });
          M.stroke(ctx, [{ x: bx, y: by }, { x: bx + bs * 0.34, y: by - bs * 0.4 }, { x: bx + bs, y: by + flap * bs * 0.8 }],
            { w: 1.8, w2: 0.5, alpha: 0.8, profile: 'taper', seg: 6 });
        }
        M.wash(ctx, 50, 70, 40, 12, { color: INK, alpha: 0.06 });
        return;
      }
      // 一枝两鸟
      var y0 = rnd(46, 64), dir = chance(0.6) ? 1 : -1;
      var limb = [{ x: rnd(2, 14), y: y0 + rnd(8, 18) }, { x: rnd(30, 46), y: y0 + rnd(-2, 6) },
        { x: rnd(66, 82), y: y0 - rnd(2, 10) }, { x: rnd(90, 100), y: y0 - rnd(6, 16) }];
      M.ink3(ctx, limb, { w: 4.2, w2: 1, alpha: 0.85, profile: 'taper', seg: 8, dry: 0.3 });
      M.branch(limb[2].x, limb[2].y, -1.2, 8, 2, 0.6).forEach(function (t) {
        if (t.length > 2) M.stroke(ctx, t, { w: 1.6, w2: 0.4, alpha: 0.8, profile: 'taper' });
      });
      var cnt = rint(1, 2);
      for (var b = 0; b < cnt; b++) {
        var px = limb[1 + b].x + rnd(-4, 4), py = limb[1 + b].y - rnd(7, 12);
        perched(px, py, rnd(7.5, 11), b % 2 ? -1 : dir);
      }
      // 叶几片
      for (var l = 0; l < rint(3, 6); l++) {
        var lp = limb[rint(1, 3)];
        M.blade(ctx, lp.x + rnd(-8, 8), lp.y + rnd(-6, 2), lp.x + rnd(-14, 14), lp.y - rnd(6, 16), rnd(1.6, 2.8),
          { color: chance(0.4) ? GREEN : INK, alpha: rnd(0.4, 0.7) });
      }
      M.wash(ctx, 50, 84, 42, 10, { color: INK, alpha: 0.07 });
    },

    swallow: function (ctx) {
      // 剪水双飞：燕子的记号是剪刀尾和又长又尖的翅膀，不是两片对称的旗
      var n = rint(2, 3);
      for (var i = 0; i < n; i++) {
        var s = rnd(10, 15) - i * 1.2;
        flyBird(ctx, rnd(16, 84), rnd(18, 66), s, {
          ang: rnd(-0.6, 0.6), spread: rnd(1.05, 1.4), fork: rnd(0.8, 1.15), phase: rnd(-0.6, 0.7)
        });
      }
      // 远处两三只只留一笔意，画面才有纵深
      for (var d = 0; d < rint(2, 4); d++) {
        var dx = rnd(10, 90), dy = rnd(12, 40), ds = rnd(3, 5);
        flyBird(ctx, dx, dy, ds, { ang: rnd(-0.6, 0.6), spread: rnd(0.9, 1.3), fork: rnd(0.5, 0.9), alpha: 0.45 });
      }
      // 一线柳梢横在角上，燕子才有个来处
      if (chance(0.7)) {
        var lx = chance(0.5) ? rnd(-4, 10) : rnd(90, 104);
        var arm = curve(lx, rnd(10, 26), lx < 50 ? 0.3 : Math.PI - 0.3, rnd(22, 40), 8, rnd(-0.06, 0.06), 0.06);
        M.stroke(ctx, arm, { w: 1.5, w2: 0.3, alpha: 0.42, color: '#6b6559', profile: 'taper', seg: 10, dry: 0.5 });
        var ap = M.smooth(arm, 8);
        for (var q = 0; q < rint(4, 7); q++) {
          var oi = rint(1, ap.length - 2), sp2 = ap[oi], sl = rnd(5, 17);
          M.stroke(ctx, [sp2, { x: sp2.x + rnd(-1.2, 2.4), y: sp2.y + sl * 0.55 },
                         { x: sp2.x + rnd(-1, 3.5), y: sp2.y + sl }],
            { w: rnd(0.3, 0.55), w2: 0.08, alpha: rnd(0.16, 0.3), color: GREEN, profile: 'taper', seg: 7, cap: false });
        }
      }
      M.wash(ctx, rnd(20, 80), rnd(70, 88), 34, 8, { color: INK, alpha: 0.07 });
    },

    crane: function (ctx) {
      var dir = chance(0.6) ? 1 : -1;
      var s = rnd(15, 19);
      var x = clamp(50 + rnd(-18, 18), 12 + s * 2, 88 - s * 2), y = rnd(44, 54);
      var water = rnd(78, 88);
      // 身：白羽一团湿墨打底，背上一片淡灰
      M.wash(ctx, x, y, s * 1.35, s * 0.9, { color: '#f7f0dd', alpha: 0.5 });
      ctx.save();
      var g = ctx.createLinearGradient(0, y - s * 0.6, 0, y + s * 0.6);
      g.addColorStop(0, M.colA(INK, 0.14));
      g.addColorStop(0.5, M.colA('#f8f2e2', 0.72));
      g.addColorStop(1, M.colA('#e8dcc0', 0.4));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, s * 1.05, s * 0.58, dir * 0.08, 0, 6.2832);
      ctx.fill();
      ctx.restore();
      // 黑色飞羽：从屁股斜扫出去的一把浓笔，是鹤身上最重的一块
      var tb = { x: x - dir * s * 0.7, y: y - s * 0.1 };
      for (var f = 0; f < rint(4, 6); f++) {
        var fa = Math.PI + (dir > 0 ? -0.45 : 0.45) + dir * rnd(-0.1, 0.5);
        var fl = s * rnd(0.8, 1.5);
        M.stroke(ctx, [tb,
          { x: tb.x + Math.cos(fa) * fl * 0.5, y: tb.y + Math.sin(fa) * fl * 0.5 - rnd(0, s * 0.2) },
          { x: tb.x + Math.cos(fa) * fl, y: tb.y + Math.sin(fa) * fl + rnd(s * 0.1, s * 0.4) }],
          { w: s * 0.2, w2: s * 0.03, alpha: rnd(0.6, 0.82), color: INK, profile: 'taper', seg: 8, dry: 0.4, cap: false });
      }
      // 颈：一笔到底的 S，粗在根、细在颏
      var nb = { x: x + dir * s * 0.55, y: y - s * 0.3 };
      var neck = [{ x: nb.x, y: nb.y },
        { x: nb.x + dir * s * 0.5, y: nb.y - s * 0.9 },
        { x: nb.x + dir * s * 0.28, y: nb.y - s * 1.75 },
        { x: nb.x + dir * s * 0.62, y: nb.y - s * 2.35 }];
      M.stroke(ctx, neck, { w: s * 0.26, w2: s * 0.1, alpha: 0.82, color: INK, profile: 'flat', seg: 11, dry: 0.3 });
      var hd = neck[neck.length - 1];
      // 头：一小团黑，顶上一抹砂红，喙是颈的延长线
      ctx.save();
      ctx.fillStyle = M.colA(INK, 0.85);
      ctx.beginPath(); ctx.ellipse(hd.x, hd.y, s * 0.24, s * 0.2, dir * 0.3, 0, 6.2832); ctx.fill();
      ctx.restore();
      M.dot(ctx, hd.x - dir * s * 0.02, hd.y - s * 0.16, s * 0.1, { color: RED, alpha: 0.9 });
      var beak = [{ x: hd.x + dir * s * 0.18, y: hd.y },
        { x: hd.x + dir * s * 0.9, y: hd.y + s * 0.12 }];
      M.stroke(ctx, beak, { w: s * 0.1, w2: s * 0.015, alpha: 0.85, color: M.darken(INK, 0.6), profile: 'taper', seg: 7, cap: false });
      // 腿：细长两根，一根直、一根在膝处折成三角；远侧那根淡一半
      [[0.18, 1], [-0.1, 0]].forEach(function (L, i) {
        var lx = x + dir * s * L[0], bend = L[1];
        ctx.save();
        ctx.globalAlpha = i ? 0.4 : 0.8;
        if (bend) {
          M.stroke(ctx, [{ x: lx, y: y + s * 0.4 }, { x: lx + dir * s * 0.35, y: water * 0.62 + y * 0.38 },
                         { x: lx + dir * s * 0.1, y: water }],
            { w: s * 0.075, w2: s * 0.05, alpha: 1, color: INK, profile: 'flat', seg: 9, cap: false });
        } else {
          M.stroke(ctx, [{ x: lx, y: y + s * 0.42 }, { x: lx - dir * s * 0.05, y: (y + water) / 2 }, { x: lx, y: water }],
            { w: s * 0.075, w2: s * 0.05, alpha: 1, color: INK, profile: 'flat', seg: 9, cap: false });
        }
        ctx.restore();
      });
      // 水：脚下两圈涟漪，加一道断岸
      ripples(ctx, water + 1, 96, rint(3, 5), {});
      M.wash(ctx, x, water, s * 1.5, s * 0.16, { color: INK, alpha: 0.14 });
      // 背景一痕远山，鹤才站在天地间
      farHills(ctx, water - 12, 12, 0.1, INK);
      if (chance(0.55)) flyBird(ctx, rnd(14, 86), rnd(14, 34), rnd(6, 9), { ang: rnd(-0.4, 0.4), spread: 1.05, fork: 0.6, alpha: 0.55 });
    },

    dragon: function (ctx) {
      // 腾云的龙：脊线是一路起伏的蛇形，从头到尾一路收细；
      // 鳞、鳍、爪、须各管各的，缺一样就退化成一条蚯蚓
      var headLeft = chance(0.55);
      var y0 = rnd(48, 60), amp = rnd(12, 18), ph = rnd(0, 6.28);
      var pts = [], N = 40;
      for (var i = 0; i <= N; i++) {
        var t = i / N;
        var x = headLeft ? (16 + t * 78) : (84 - t * 78);
        var y = y0 - Math.sin(t * Math.PI * 2.4 + ph) * amp * (0.6 + 0.4 * (1 - t)) - t * t * rnd(6, 14);
        pts.push({ x: x, y: y + rnd(-0.5, 0.5) });
      }
      // 云气先铺一层，身子后半截要藏进去
      var cloud = [];
      for (var c = 0; c < rint(2, 3); c++) {
        var cp = pts[rint(Math.round(N * 0.5), N - 3)];
        cloud.push({ x: cp.x + rnd(-6, 6), y: cp.y - rnd(2, 10), r: rnd(9, 15) });
      }
      limb(ctx, pts, { w: 5.8, w2: 0.9, alpha: 0.44, color: '#4a4238', dry: 0, edgeAlpha: 0.16, washAlpha: 0.06, seg: 12, joints: false });
      var sp = M.smooth(pts, 6);
      // 背线与腹线：一路浓一路淡，身子才是圆的；干笔皴出来的毛边是虫不是龙
      var bd = headLeft ? -1 : 1;
      M.stroke(ctx, nudge(pts, 2.5 * bd), { w: 1.5, w2: 0.5, alpha: 0.6, color: M.darken(INK, 0.85), profile: 'flat', seg: 12, cap: false, dry: 0.28 });
      M.stroke(ctx, nudge(pts, -2.5 * bd), { w: 1.4, w2: 0.5, alpha: 0.4, color: '#efe6cf', profile: 'flat', seg: 12, cap: false });
      // 脊鳍：稀一点、往后倒。等距的正三角摆一排就是锯条
      for (var k = 4; k < sp.length * 0.7; k += rint(8, 11)) {
        var p = sp[k], q = sp[Math.min(sp.length - 1, k + 3)];
        var a = Math.atan2(q.y - p.y, q.x - p.x);
        var u = k / sp.length;
        if (chance(0.3)) continue;
        var hgt = (1 - u) * rnd(4.2, 6.4) + 1.4;
        var nx = Math.cos(a - Math.PI / 2), ny = Math.sin(a - Math.PI / 2);
        var tip = { x: p.x + nx * hgt + Math.cos(a) * hgt * 0.75, y: p.y + ny * hgt + Math.sin(a) * hgt * 0.75 };
        ctx.save();
        ctx.globalAlpha = 0.5 - u * 0.22;
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.moveTo(p.x - Math.cos(a) * hgt * 0.42, p.y - Math.sin(a) * hgt * 0.42);
        ctx.quadraticCurveTo(p.x + nx * hgt * 0.8, p.y + ny * hgt * 0.8, tip.x, tip.y);
        ctx.lineTo(p.x + Math.cos(a) * hgt * 0.62, p.y + Math.sin(a) * hgt * 0.62);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // 鳞：只在身子中段，一排排顺着的弧，淡到能数清又不吵
      for (var s0 = 4; s0 < sp.length - 10; s0 += 4) {
        var pp = sp[s0], qq = sp[s0 + 2];
        var aa = Math.atan2(qq.y - pp.y, qq.x - pp.x);
        var nxs = -Math.sin(aa), nys = Math.cos(aa);
        ctx.save();
        ctx.globalAlpha = 0.17;
        ctx.strokeStyle = M.darken(INK, 0.6);
        ctx.lineWidth = 0.5;
        for (var wq = -1; wq <= 1; wq++) {
          var cx0 = pp.x + nxs * wq * 2.4, cy0 = pp.y + nys * wq * 2.4;
          ctx.beginPath();
          ctx.arc(cx0, cy0, 1.7, aa - 0.4, aa + 2.3);
          ctx.stroke();
        }
        ctx.restore();
      }
      // 爪：从腹下探出两到三只，三趾各带一勾
      var legN = rint(2, 3);
      for (var lg = 0; lg < legN; lg++) {
        var at = sp[Math.round(sp.length * (0.18 + lg * 0.3))];
        if (!at) continue;
        var la = Math.PI / 2 + rnd(-0.7, 0.7);
        var knee = { x: at.x + rnd(-4, 4), y: at.y + rnd(6, 11) };
        var foot = { x: knee.x + rnd(-9, 9), y: knee.y + rnd(4, 9) };
        M.stroke(ctx, [at, knee, foot], { w: 2.6, w2: 0.9, alpha: 0.66, color: INK, profile: 'flat', seg: 8, dry: 0.3 });
        for (var tc = 0; tc < 3; tc++) {
          var ta2 = Math.atan2(foot.y - knee.y, foot.x - knee.x) + (tc - 1) * rnd(0.4, 0.6);
          M.stroke(ctx, [foot, { x: foot.x + Math.cos(ta2) * rnd(3.5, 6), y: foot.y + Math.sin(ta2) * rnd(3, 5) }],
            { w: 0.9, w2: 0.15, alpha: 0.72, color: M.darken(INK, 0.6), profile: 'taper', seg: 5, cap: false });
        }
      }
      // 头：颈端往外就是脸的方向
      var hc = pts[0];
      var fa2 = Math.atan2(hc.y - pts[4].y, hc.x - pts[4].x);
      var fx = Math.cos(fa2), fy = Math.sin(fa2), sx = -fy, sy = fx;
      function H(f, sd) { return { x: hc.x + fx * f + sx * sd, y: hc.y + fy * f + sy * sd }; }
      // 颅 + 上下颌：中间咬出一道口，不是一根实心棍
      ctx.save();
      ctx.fillStyle = M.colA(INK, 0.8);
      ctx.beginPath();
      ctx.ellipse(hc.x + fx * 1.5, hc.y + fy * 1.5, 5.4, 3.6, fa2, 0, 6.2832);
      ctx.fill();
      ctx.restore();
      M.stroke(ctx, [H(3, 1.6), H(9, 2.2), H(14, 1)], { w: 3.4, w2: 1.2, alpha: 0.8, color: INK, profile: 'flat', seg: 8 });
      M.stroke(ctx, [H(2, -1.2), H(7, -2.4), H(11.5, -2.2)], { w: 2.4, w2: 0.7, alpha: 0.76, color: INK, profile: 'flat', seg: 8 });
      // 齿：口缝里几点留白
      for (var tt = 0; tt < 4; tt++) {
        var tp3 = H(5 + tt * 2.2, 0.4 + rnd(-0.5, 0.5));
        M.dot(ctx, tp3.x, tp3.y, 0.5, { color: '#f6efdd', alpha: 0.85 });
      }
      // 角：从颅顶往后上方挑出去，分一次叉
      for (var hn = 0; hn < 2; hn++) {
        var hb = H(-0.5 + hn * 1.4, 3.2 - hn * 1.2);
        var hp3 = curve(hb.x, hb.y, fa2 + rnd(2.2, 2.6), rnd(9, 13), 8, rnd(-0.12, -0.04), 0.03);
        M.stroke(ctx, hp3, { w: 1.8, w2: 0.3, alpha: 0.78, color: M.darken(INK, 0.65), profile: 'taper', seg: 8, cap: false });
        var mid = hp3[Math.round(hp3.length * 0.55)];
        M.stroke(ctx, [mid, { x: mid.x + rnd(-5, 5), y: mid.y - rnd(3, 6) }],
          { w: 0.9, w2: 0.15, alpha: 0.6, color: M.darken(INK, 0.65), profile: 'taper', seg: 5, cap: false });
      }
      // 须：从吻端拖出两根长线，龙的神气全在这两条上
      for (var wh = 0; wh < 2; wh++) {
        var wb = H(12, wh ? -1.4 : 1.8);
        var wp = curve(wb.x, wb.y, fa2 + (wh ? -0.5 : 0.45), rnd(14, 20), 9, (wh ? -0.09 : 0.08), 0.03);
        M.stroke(ctx, wp, { w: 1.1, w2: 0.12, alpha: 0.66, color: INK, profile: 'taper', seg: 10, cap: false });
      }
      // 鬣：颅后一撮逆风的毛
      for (var mn = 0; mn < 6; mn++) {
        var mb = H(-2, rnd(-2.5, 2.5));
        var ma = fa2 + Math.PI + rnd(-0.5, 0.5);
        M.stroke(ctx, [mb, { x: mb.x + Math.cos(ma) * rnd(5, 10), y: mb.y + Math.sin(ma) * rnd(4, 9) }],
          { w: 1.1, w2: 0.15, alpha: 0.6, color: INK, profile: 'taper', seg: 5, cap: false });
      }
      var eye = H(1.5, 1.6);
      M.dot(ctx, eye.x, eye.y, 1.3, { color: RED, alpha: 0.92 });
      M.dot(ctx, eye.x + fx * 0.4, eye.y + fy * 0.4, 0.5, { color: '#f6efdd', alpha: 0.9 });
      // 云最后压上去，后半身在雾里若隐若现
      cloud.forEach(function (cl) { cloudMass(ctx, cl.x, cl.y, cl.r, rnd(0.3, 0.42)); });
      M.air(ctx, hc.x, hc.y, 20, 12, {});
    },

    horse: function (ctx) {
      var s = rnd(20, 25), dir = chance(0.6) ? 1 : -1;
      var x = clamp(50 + rnd(-18, 18), 10 + s * 1.7, 90 - s * 1.7), y = rnd(46, 54);
      // 立姿：颈斜挑不直竖，鬃往后倒，腿比身子浅一档
      beast(ctx, x, y, s, {
        dir: dir, color: chance(0.3) ? '#5a5044' : INK, alpha: 0.72, hump: -0.2, depth: 0.36,
        neck: { ang: -1.0, len: 0.62, w: 0.42 }, neckCurl: 0.08,
        head: 'muzzle', headLen: 0.46, muzzleDip: 0.22,
        legLen: 1.0, legW: 0.135, mane: true,
        tail: 1.15, tailHair: true, tailCurl: 0.16
      });
      // 蹄前几点草，站的地方才不是空白纸
      for (var g = 0; g < rint(3, 6); g++) {
        var gx = x + rnd(-s * 1.7, s * 1.7), gy = y + s * 1.3 + rnd(-1, 3);
        M.stroke(ctx, [{ x: gx, y: gy }, { x: gx + rnd(-2, 2), y: gy - rnd(2, 5) }],
          { w: 0.5, w2: 0.1, alpha: rnd(0.2, 0.4), profile: 'taper', seg: 5, cap: false });
      }
      M.wash(ctx, 50, 88, 46, 8, { color: INK, alpha: 0.06 });
    },

    ox: function (ctx) {
      var s = rnd(20, 25), dir = chance(0.6) ? 1 : -1;
      var x = clamp(50 + rnd(-18, 18), 10 + s * 1.7, 90 - s * 1.7), y = rnd(48, 56);
      // 牛：肩峰拱起、颈粗而短、腿短，角是往外挑的两笔
      beast(ctx, x, y, s, {
        dir: dir, color: chance(0.35) ? '#4c463d' : INK, alpha: 0.74, hump: 0.8, depth: 0.48,
        neck: { ang: -0.88, len: 0.36, w: 0.66 }, neckCurl: 0.16,
        head: 'muzzle', headLen: 0.42, muzzleDip: 0.24, headAlpha: 0.5, headTop: '#6a6254',
        horns: true, hornSpan: 0.52, hornColor: '#6b6154', legLen: 0.76, legW: 0.18,
        tail: 0.95, tailHair: true, tailCurl: 0.22
      });
      // 颈下一坨垂皮，牛的体量全在这一块
      M.wash(ctx, x + dir * s * 0.62, y + s * 0.12, s * 0.3, s * 0.24, { color: INK, alpha: 0.16 });
      for (var g = 0; g < rint(4, 8); g++) {
        var gx = x + rnd(-s * 1.8, s * 1.8), gy = y + s * 0.95 + rnd(-1, 3);
        taperLeaf(ctx, gx, gy, -Math.PI / 2 + rnd(-0.5, 0.5), rnd(2.5, 5.5), rnd(0.5, 1),
          { color: chance(0.4) ? GREEN : INK, alpha: rnd(0.24, 0.44), bend: rnd(-0.2, 0.2) });
      }
      M.wash(ctx, 50, 90, 44, 7, { color: INK, alpha: 0.06 });
    },

    cat: function (ctx) {
      var s = rnd(14, 18), dir = chance(0.55) ? 1 : -1;
      var x = clamp(50 + rnd(-22, 22), 14 + s * 1.8, 86 - s * 1.8), y = rnd(52, 60);
      var gy = y + s * 0.98;
      var col = chance(0.4) ? '#5a4a38' : INK;
      var dk = M.darken(col, 0.6), pale = '#f4ecd8';
      // 蹲坐的猫：下宽上窄的一个梨，不是一枚竖卵
      var bp = [
        { x: x - s * 0.6, y: gy - s * 0.04 },
        { x: x - s * 0.84, y: y + s * 0.24 },
        { x: x - s * 0.68, y: y - s * 0.28 },
        { x: x - s * 0.34, y: y - s * 0.62 },
        { x: x + s * 0.32, y: y - s * 0.6 },
        { x: x + s * 0.62, y: y - s * 0.24 },
        { x: x + s * 0.8, y: y + s * 0.3 },
        { x: x + s * 0.58, y: gy - s * 0.02 }
      ];
      var bs = M.smooth(bp, 4);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(bs[0].x, bs[0].y);
      for (var i = 1; i < bs.length; i++) ctx.lineTo(bs[i].x, bs[i].y);
      ctx.closePath();
      var bg = ctx.createLinearGradient(x - s * 0.7, y - s * 0.6, x + s * 0.7, gy);
      bg.addColorStop(0, M.colA(pale, 0.5));
      bg.addColorStop(0.42, M.colA(col, 0.44));
      bg.addColorStop(1, M.colA(dk, 0.5));
      ctx.fillStyle = bg; ctx.fill();
      // 毛：背上顺着脊走几笔干笔，光溜溜才像瓷
      ctx.clip();
      for (var f0 = 0; f0 < rint(9, 14); f0++) {
        var fx0 = x + rnd(-s * 0.66, s * 0.66), fy0 = y + rnd(-s * 0.5, s * 0.5);
        M.stroke(ctx, [{ x: fx0, y: fy0 }, { x: fx0 + rnd(-1.4, 1.4), y: fy0 + rnd(2, 4.5) }],
          { w: rnd(0.5, 1.1), w2: 0.15, alpha: rnd(0.14, 0.3), color: dk, profile: 'taper', seg: 4, dry: 0.6, cap: false });
      }
      // 胸前一片白
      M.wash(ctx, x + dir * s * 0.22, y + s * 0.18, s * 0.4, s * 0.52, { color: pale, alpha: 0.55 });
      ctx.restore();
      // 身子的边：只压背光那半边，通圈描就成了贴纸
      M.stroke(ctx, bs.slice(Math.round(bs.length * 0.5), Math.round(bs.length * 0.92)),
        { w: s * 0.07, w2: s * 0.02, alpha: 0.5, color: dk, profile: 'flat', seg: 6, dry: 0.45, cap: false });
      // 后腿的股：身侧一道弧，蹲姿才立得住
      M.stroke(ctx, [{ x: x - dir * s * 0.66, y: y + s * 0.06 }, { x: x - dir * s * 0.42, y: y + s * 0.36 },
        { x: x - dir * s * 0.1, y: gy - s * 0.1 }],
        { w: s * 0.06, w2: s * 0.02, alpha: 0.4, color: dk, profile: 'flat', seg: 7, cap: false });
      // 前腿：两根从胸口 straight 走到地上，末梢一掌，不是悬空的两道杠
      for (var lg = 0; lg < 2; lg++) {
        var lx = x + dir * s * (0.14 + lg * 0.26), ltop = y + s * 0.02;
        M.stroke(ctx, [{ x: lx, y: ltop }, { x: lx - dir * s * 0.02, y: gy - s * 0.16 }],
          { w: s * 0.15, w2: s * 0.13, alpha: 0.34, color: col, profile: 'flat', seg: 6, cap: false });
        ctx.save();
        ctx.fillStyle = M.colA(col, 0.5);
        ctx.beginPath(); ctx.ellipse(lx, gy - s * 0.06, s * 0.11, s * 0.062, 0, 0, 6.2832); ctx.fill();
        ctx.restore();
        for (var t3 = 0; t3 < 2; t3++) {
          M.stroke(ctx, [{ x: lx + (t3 ? s * 0.04 : -s * 0.04), y: gy - s * 0.02 },
            { x: lx + (t3 ? s * 0.05 : -s * 0.05), y: gy - s * 0.1 }],
            { w: 0.4, w2: 0.15, alpha: 0.4, color: dk, profile: 'flat', seg: 3, cap: false });
        }
      }
      // 尾：从屁股绕到身前，一笔到底，末端不加圆锋
      var tp = curve(x - dir * s * 0.72, y + s * 0.42, dir > 0 ? -2.9 : -0.24, s * 1.7, 10, dir * rnd(0.18, 0.3), 0.03);
      M.stroke(ctx, tp, { w: s * 0.17, w2: s * 0.03, alpha: 0.66, color: col, profile: 'taper', seg: 10, cap: false });
      // 头：圆脸加两只尖耳，耳里一抹薄粉
      var hx = x + dir * s * 0.1, hy = y - s * 0.78, hr = s * 0.44;
      M.wash(ctx, hx, hy, hr * 1.6, hr * 1.5, { color: col, alpha: 0.1 });
      ctx.save();
      var hgc = ctx.createLinearGradient(hx - hr, hy - hr, hx + hr, hy + hr * 0.6);
      hgc.addColorStop(0, M.colA(pale, 0.5));
      hgc.addColorStop(0.5, M.colA(col, 0.5));
      hgc.addColorStop(1, M.colA(dk, 0.62));
      ctx.fillStyle = hgc;
      ctx.beginPath(); ctx.ellipse(hx, hy, hr, hr * 0.9, dir * 0.08, 0, 6.2832); ctx.fill();
      for (var e = 0; e < 2; e++) {
        var es = e ? 1 : -1;
        var ean = -Math.PI / 2 + es * rnd(0.34, 0.56);
        taperLeaf(ctx, hx + es * hr * 0.52, hy - hr * 0.5, ean, hr * rnd(0.8, 1.0), hr * 0.4,
          { color: col, alpha: 0.78, bend: es * 0.1 });
        taperLeaf(ctx, hx + es * hr * 0.5, hy - hr * 0.46, ean, hr * 0.5, hr * 0.2,
          { color: '#c99a8a', alpha: 0.42, bend: es * 0.1 });
      }
      ctx.restore();
      // 脸：竖瞳、三角鼻、八字须——黑团上点两个白点是洋娃娃
      for (var ey2 = 0; ey2 < 2; ey2++) {
        var es2 = ey2 ? 1 : -1;
        var ex = hx + es2 * hr * 0.38 + dir * hr * 0.06, eyy = hy - hr * 0.04;
        ctx.save();
        ctx.fillStyle = M.colA('#f8f3e2', 0.9);
        ctx.beginPath(); ctx.ellipse(ex, eyy, hr * 0.2, hr * 0.15, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = M.colA('#1f1c17', 0.9);
        ctx.beginPath(); ctx.ellipse(ex, eyy, hr * 0.055, hr * 0.14, 0, 0, 6.2832); ctx.fill();
        ctx.restore();
        M.stroke(ctx, [{ x: ex - hr * 0.22, y: eyy - hr * 0.06 }, { x: ex, y: eyy - hr * 0.18 },
          { x: ex + hr * 0.22, y: eyy - hr * 0.05 }],
          { w: s * 0.035, w2: s * 0.015, alpha: 0.66, color: dk, profile: 'flat', seg: 4, cap: false });
      }
      var nx = hx + dir * hr * 0.06, ny = hy + hr * 0.3;
      ctx.save();
      ctx.fillStyle = M.colA('#a8625c', 0.7);
      ctx.beginPath();
      ctx.moveTo(nx - hr * 0.11, ny - hr * 0.05); ctx.lineTo(nx + hr * 0.11, ny - hr * 0.05);
      ctx.lineTo(nx, ny + hr * 0.1); ctx.closePath(); ctx.fill();
      ctx.restore();
      M.stroke(ctx, [{ x: nx, y: ny + hr * 0.1 }, { x: nx - hr * 0.18, y: ny + hr * 0.28 }],
        { w: s * 0.03, w2: s * 0.012, alpha: 0.5, color: dk, profile: 'flat', seg: 4, cap: false });
      M.stroke(ctx, [{ x: nx, y: ny + hr * 0.1 }, { x: nx + hr * 0.18, y: ny + hr * 0.28 }],
        { w: s * 0.03, w2: s * 0.012, alpha: 0.5, color: dk, profile: 'flat', seg: 4, cap: false });
      for (var w0 = 0; w0 < 2; w0++) {
        var ws = w0 ? 1 : -1;
        for (var wc = 0; wc < 3; wc++) {
          var wa = ws * (0.06 + wc * 0.24) + (dir > 0 ? 0 : Math.PI);
          var wl = hr * rnd(1.0, 1.5);
          M.stroke(ctx, [{ x: nx + ws * hr * 0.2, y: ny - hr * 0.02 + wc * hr * 0.08 },
            { x: nx + ws * hr * 0.2 + Math.cos(wa) * wl * ws, y: ny - hr * 0.02 + wc * hr * 0.08 + Math.sin(wa) * wl * 0.5 }],
            { w: 0.35, w2: 0.1, alpha: rnd(0.34, 0.55), color: wc === 1 ? dk : '#6b6152', profile: 'flat', seg: 4, cap: false });
        }
      }
      // 地：一道地平把猫放在地上
      M.stroke(ctx, [{ x: 6, y: gy + 1 }, { x: x + rnd(-4, 4), y: gy + rnd(0, 1.6) }, { x: 94, y: gy + 0.6 }],
        { w: 1.3, w2: 0.35, alpha: 0.28, profile: 'flat', seg: 12, dry: 0.55, cap: false });
      M.wash(ctx, x + dir * s * 0.2, gy + 2.2, s * 1.5, s * 0.16, { color: INK, alpha: 0.2 });
      M.air(ctx, x - dir * s * 1.2, hy - s * 0.6, 12, 6, {});
    },
    tiger: function (ctx) {
      var s = rnd(18, 23), dir = chance(0.55) ? 1 : -1;
      var x = clamp(50 + rnd(-20, 20), 10 + s * 1.7, 90 - s * 1.7), y = rnd(50, 60);
      // 虎：赭黄的身、浓墨的斑，斑必须顺着脊背的弧度往下走
      var sp = beast(ctx, x, y, s, {
        dir: dir, color: '#b0803c', dark: '#8a5a24', belly: '#f6efdc', alpha: 0.62,
        hump: -0.12, depth: 0.44,
        neck: { ang: -1.05, len: 0.4, w: 0.5 }, neckCurl: 0.08,
        head: 'round', headLen: 0.44, earColor: '#8a5a24',
        legLen: 0.88, legW: 0.16,
        tail: 1.3, tailUp: true, tailCurl: -0.2
      });
      // 斑：背线上取七八点，每点往腹部垂一笔。spine 已经平滑过，再 smooth 一次就密成一排刺
      var path = sp.spine, st = Math.max(2, Math.round(path.length / 8));
      for (var i = st; i < path.length - st; i += Math.max(2, Math.round(st * rnd(0.72, 1.3)))) {
        var p = path[i], q = path[Math.min(path.length - 1, i + st)];
        var a = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2;
        // 斑一律往腹部垂，镜像之后要是还朝背上挑，就长成了豪猪
        if (Math.sin(a) < 0) a += Math.PI;
        var len = s * rnd(0.26, 0.46);
        var pts = [{ x: p.x + dir * s * 0.04, y: p.y + s * 0.05 }];
        for (var k = 1; k <= 3; k++) {
          pts.push({ x: p.x + Math.cos(a) * len * k / 3 + dir * s * 0.06 * (k / 3),
                     y: p.y + s * 0.05 + Math.sin(a) * len * k / 3 + s * 0.03 * Math.sin(k) });
        }
        M.stroke(ctx, pts, { w: s * 0.1, w2: s * 0.035, alpha: 0.62, color: INK, profile: 'brush', seg: 7, dry: 0.35, cap: false });
      }
      // 额上“王”字：只作笔意，两短弧一竖，画成三条直线就成了栅栏
      var hd = sp.head;
      for (var w = 0; w < 2; w++) {
        M.stroke(ctx, [{ x: hd.x - s * 0.11, y: hd.y - s * 0.13 + w * s * 0.11 },
                       { x: hd.x, y: hd.y - s * 0.17 + w * s * 0.12 },
                       { x: hd.x + s * 0.11, y: hd.y - s * 0.13 + w * s * 0.11 }],
          { w: s * 0.05, w2: s * 0.035, alpha: 0.72, color: INK, profile: 'flat', seg: 5, cap: false });
      }
      M.stroke(ctx, [{ x: hd.x, y: hd.y - s * 0.2 }, { x: hd.x, y: hd.y + s * 0.02 }],
        { w: s * 0.05, w2: s * 0.04, alpha: 0.7, color: INK, profile: 'flat', seg: 4, cap: false });
      for (var g = 0; g < rint(3, 6); g++) {
        var gx = x + rnd(-s * 1.9, s * 1.9), gy = y + s * 1.05 + rnd(-1, 3);
        taperLeaf(ctx, gx, gy, -Math.PI / 2 + rnd(-0.5, 0.5), rnd(2.5, 6), rnd(0.5, 1),
          { color: chance(0.4) ? GREEN : INK, alpha: rnd(0.26, 0.46), bend: rnd(-0.2, 0.2) });
      }
      M.wash(ctx, 50, 90, 44, 7, { color: INK, alpha: 0.06 });
    },

    rabbit: function (ctx) {
      var s = rnd(13, 18), dir = chance(0.55) ? 1 : -1;
      var x = clamp(50 + rnd(-22, 22), 12 + s * 1.8, 88 - s * 1.8), y = rnd(58, 70);
      // 伏兔：后腿一团、前胸一团，两头之间塌出背线；长耳一前一后错开
      ctx.save();
      var g = ctx.createLinearGradient(0, y - s * 0.5, 0, y + s * 0.55);
      g.addColorStop(0, M.colA(INK, 0.4));
      g.addColorStop(0.55, M.colA('#5a5348', 0.34));
      g.addColorStop(1, M.colA('#f4ecd8', 0.5));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x - dir * s * 0.28, y, s * 0.78, s * 0.52, -dir * 0.1, 0, 6.2832);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + dir * s * 0.52, y + s * 0.08, s * 0.42, s * 0.38, dir * 0.16, 0, 6.2832);
      ctx.fill();
      ctx.restore();
      // 背上顺毛几笔淡丝，一团墨才成毛而不成蛋
      for (var fu = 0; fu < rint(4, 7); fu++) {
        var ft = rnd(-0.55, 0.5);
        M.stroke(ctx, [{ x: x + ft * s * 0.7, y: y - s * 0.44 },
                       { x: x + ft * s * 0.7 + dir * s * 0.05, y: y - s * 0.16 }],
          { w: s * 0.05, w2: s * 0.012, alpha: rnd(0.14, 0.26), color: '#f4ecd8', profile: 'taper', seg: 5, cap: false });
      }
      // 臀上一团白，是兔最要紧的记号
      M.wash(ctx, x - dir * s * 0.95, y + s * 0.05, s * 0.3, s * 0.26, { color: '#f7f0dd', alpha: 0.75 });
      // 头：一小团，鼻尖点浓
      var hx = x + dir * s * 0.86, hy = y - s * 0.14;
      ctx.save();
      var hg = ctx.createLinearGradient(hx - dir * s * 0.3, hy - s * 0.2, hx + dir * s * 0.3, hy + s * 0.2);
      hg.addColorStop(0, M.colA('#f4ecd8', 0.62));
      hg.addColorStop(0.6, M.colA('#5a5348', 0.5));
      hg.addColorStop(1, M.colA(INK, 0.6));
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.ellipse(hx, hy, s * 0.3, s * 0.26, dir * 0.2, 0, 6.2832); ctx.fill();
      ctx.restore();
      // 耳：两枚长叶生在脑后，一竖一斜。粗笔往上挑就成了触须
      for (var e = 0; e < 2; e++) {
        var eb = { x: hx - dir * s * (0.04 + e * 0.12), y: hy - s * 0.16 };
        var ea = -Math.PI / 2 + dir * (e ? rnd(0.2, 0.46) : rnd(-0.04, 0.16));
        taperLeaf(ctx, eb.x, eb.y, ea, s * rnd(0.8, 1.05), s * (e ? 0.12 : 0.15),
          { color: INK, alpha: e ? 0.46 : 0.66, bend: dir * rnd(0.1, 0.26) });
      }
      M.dot(ctx, hx + dir * s * 0.28, hy + s * 0.04, s * 0.045, { color: M.darken(INK, 0.5), alpha: 0.85 });
      M.dot(ctx, hx + dir * s * 0.1, hy - s * 0.04, s * 0.032, { color: '#f4ecd8', alpha: 0.9 });
      // 前爪两点，后腿一道弧
      M.stroke(ctx, [{ x: x + dir * s * 0.6, y: y + s * 0.3 }, { x: x + dir * s * 0.78, y: y + s * 0.44 }],
        { w: s * 0.08, w2: s * 0.04, alpha: 0.5, color: INK, profile: 'flat', seg: 5, cap: false });
      M.wash(ctx, x, y + s * 0.56, s * 1.7, s * 0.13, { color: INK, alpha: 0.17 });
      for (var q = 0; q < rint(4, 7); q++) {
        var qx = x + rnd(-s * 1.9, s * 1.9), qy = y + s * 0.55 + rnd(-1, 3);
        M.stroke(ctx, [{ x: qx, y: qy }, { x: qx + rnd(-2, 2), y: qy - rnd(2.5, 6) }],
          { w: 0.55, w2: 0.12, alpha: rnd(0.22, 0.42), profile: 'taper', seg: 5, cap: false });
      }
    },

    insect: function (ctx) {
      // 草虫：先有一片叶或一茎，虫站在上面才有分量
      var lx = rnd(20, 44), ly = rnd(58, 76);
      var la = rnd(-0.9, -0.2);
      var llen = rnd(40, 58);
      var leafPts = [{ x: lx, y: ly }];
      var lmid = { x: lx + Math.cos(la) * llen * 0.5, y: ly + Math.sin(la) * llen * 0.5 };
      var ltip = { x: lx + Math.cos(la) * llen, y: ly + Math.sin(la) * llen };
      ctx.save();
      ctx.fillStyle = M.colA(GREEN, 0.34);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(lmid.x - Math.sin(la) * 11, lmid.y + Math.cos(la) * 11, ltip.x, ltip.y);
      ctx.quadraticCurveTo(lmid.x + Math.sin(la) * 11, lmid.y - Math.cos(la) * 11, lx, ly);
      ctx.fill();
      ctx.restore();
      M.stroke(ctx, [{ x: lx, y: ly }, lmid, ltip], { w: 0.8, w2: 0.25, alpha: 0.42, color: M.darken(GREEN, 0.6), profile: 'taper', seg: 9, cap: false });
      var s = rnd(17, 23);
      var bx = lmid.x + rnd(-4, 4), by = lmid.y - rnd(1, 5);
      bug(ctx, bx, by, s, {
        ang: la + rnd(-0.35, 0.35), dir: 1, segs: rint(3, 4), legs: 3, legReach: 0.52,
        hind: chance(0.6), hair: chance(0.4), wing2: chance(0.5),
        color: chance(0.4) ? '#3f5136' : INK
      });
      // 虫粪与咬痕：几粒浓点，画面上最容易被忽略的一笔
      for (var d = 0; d < rint(3, 6); d++) {
        M.dot(ctx, bx + rnd(-16, 10), by + rnd(2, 14), rnd(0.35, 0.8), { color: INK, alpha: rnd(0.3, 0.55) });
      }
      M.moss(ctx, rnd(10, 30), rnd(84, 94), rint(4, 8), { spread: 6, alpha: 0.5 });
      M.wash(ctx, 50, 90, 44, 8, { color: INK, alpha: 0.06 });
    },

    butterfly: function (ctx) {
      var x = rnd(34, 66), y = rnd(34, 58), s = rnd(15, 23);
      var tint = M.pick([RED, '#c76a86', '#9c6b8e', BLUE]);
      function wing(dir, up) {
        var L = s * (up ? 1 : 0.68), Hh = s * (up ? 0.86 : 0.6);
        var p0 = { x: x, y: y + (up ? -s * 0.1 : s * 0.12) };
        var tip = { x: x + dir * L, y: y + (up ? -Hh : Hh * 0.8) };
        var c1 = { x: x + dir * L * 0.9, y: y + (up ? -Hh * 0.2 : Hh * 1.0) };
        var c2 = { x: x + dir * L * 0.28, y: y + (up ? -Hh * 1.1 : Hh * 0.2) };
        var pts = [p0, c2, tip, c1, { x: x + dir * s * 0.18, y: y + (up ? -s * 0.02 : s * 0.2) }];
        // 膜：淡墨一层，色一层
        ctx.save();
        ctx.globalAlpha = 0.16; ctx.fillStyle = INK;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        M.wash(ctx, (x + tip.x) / 2, (y + tip.y) / 2, L * 0.6, Hh * 0.5, { color: tint, alpha: 0.3 });
        // 缘：浓墨勾一圈，带飞白
        M.stroke(ctx, pts.concat([p0]), { w: s * 0.12, w2: s * 0.05, alpha: 0.8, color: M.darken(INK, 0.65), profile: 'flat', seg: 10, dry: 0.45 });
        // 脉纹
        for (var v = 0; v < 3; v++) {
          M.stroke(ctx, [{ x: x + dir * s * 0.1, y: y }, { x: tip.x * 0.6 + (x + dir * s * 0.2) * 0.4, y: y + (up ? -Hh : Hh) * (0.3 + v * 0.3) },
            { x: x + dir * L * (0.5 + v * 0.2), y: y + (up ? -Hh : Hh) * (0.35 + v * 0.28) }],
            { w: s * 0.045, w2: s * 0.02, alpha: 0.5, profile: 'flat', seg: 8 });
        }
        // 斑
        M.dot(ctx, x + dir * L * 0.62, y + (up ? -Hh : Hh) * 0.5, s * rnd(0.08, 0.14), { color: tint, alpha: 0.8 });
        M.dot(ctx, x + dir * L * 0.4, y + (up ? -Hh : Hh) * 0.28, s * 0.06, { color: '#f4ecd8', alpha: 0.75 });
      }
      wing(-1, true); wing(1, true); wing(-1, false); wing(1, false);
      // 身与须
      M.stroke(ctx, [{ x: x, y: y - s * 0.4 }, { x: x, y: y + s * 0.5 }], { w: s * 0.1, w2: s * 0.04, alpha: 0.88, color: M.darken(INK, 0.6), profile: 'flat', seg: 6 });
      M.dot(ctx, x, y - s * 0.46, s * 0.09, { alpha: 0.88 });
      [[-1, 1], [1, 1]].forEach(function (d) {
        M.stroke(ctx, [{ x: x, y: y - s * 0.5 }, { x: x + d[0] * s * 0.22, y: y - s * 0.82 }, { x: x + d[0] * s * 0.42, y: y - s * 0.98 }],
          { w: s * 0.035, w2: 0.15, alpha: 0.75, profile: 'taper', seg: 8 });
      });
      M.wash(ctx, x, y, s * 1.6, s * 1.4, { color: INK, alpha: 0.06 });
      if (chance(0.7)) {
        var fx = x + rnd(-22, 22), fy = y + rnd(10, 26);
        fiveFlower(ctx, fx, fy, rnd(4.5, 8), '#d9768a', 0.72);
        M.stroke(ctx, [{ x: fx, y: fy + 5 }, { x: fx + rnd(-3, 3), y: fy + rnd(12, 22) }], { w: 1.2, w2: 0.4, alpha: 0.6, profile: 'taper' });
      }
    },

    bee: function (ctx) {
      // 蜂：毛胸、黄黑道子、一对抖着的纱翅，追着一朵花
      var fx = rnd(22, 78), fy = rnd(58, 80);
      var s = rnd(13, 17);
      var x = clamp(fx + rnd(-22, 22), 14, 86), y = clamp(fy - rnd(14, 30), 16, 62);
      var ang = Math.atan2(fy - y, fx - x) + rnd(-0.3, 0.3);
      // 飞行轨迹：一路抖过去的细线，只拖半程
      var tr = curve(x + Math.cos(ang + Math.PI) * s * 0.8, y + Math.sin(ang + Math.PI) * s * 0.8,
        ang + Math.PI, rnd(16, 30), 12, 0, 0.22);
      M.stroke(ctx, tr, { w: 0.45, w2: 0.2, alpha: 0.24, color: INK, profile: 'flat', seg: 10, cap: false });
      // 蜂的腿收在身下，伸太开就成了蜘蛛
      bug(ctx, x, y, s, {
        ang: ang, dir: 1, segs: 3, legs: 3, legReach: 0.56, hair: true, hairN: 9, hairLen: 0.07,
        stripes: true, color: '#8a6a24', eyes: INK, wingRot: -1.05, wing2: true
      });
      // 蜜黄压回身上，条纹才不是拿刀刻的
      M.wash(ctx, x, y, s * 0.9, s * 0.5, { color: '#d2a53a', alpha: 0.3 });
      fiveFlower(ctx, fx, fy, rnd(5, 8), '#c9a03c', 0.72);
      if (chance(0.7)) fiveFlower(ctx, clamp(fx + rnd(-26, 26), 8, 92), clamp(fy + rnd(-6, 14), 10, 92), rnd(3.5, 6), '#b98c33', 0.55);
      for (var g = 0; g < rint(2, 4); g++) {
        var gx = clamp(fx + rnd(-16, 16), 6, 94), gy = fy + rnd(8, 20);
        M.stroke(ctx, [{ x: gx, y: gy + 8 }, { x: gx + rnd(-2, 2), y: gy - rnd(4, 10) }],
          { w: 0.6, w2: 0.15, alpha: rnd(0.28, 0.46), color: GREEN, profile: 'taper', seg: 6, cap: false });
      }
      M.wash(ctx, 50, 92, 44, 6, { color: INK, alpha: 0.05 });
    },

    firefly: function (ctx) {
      // 流萤：夜草是黑的，光点只留一层暖晕和一粒亮芯，绝不能用浓墨点睛
      M.wash(ctx, rnd(30, 70), rnd(74, 88), 52, 16, { color: INK, alpha: 0.1 });
      var n = rint(7, 12);
      for (var i = 0; i < n; i++) {
        var x = rnd(8, 92), y = rnd(22, 82), r = rnd(0.7, 1.7);
        M.wash(ctx, x, y, r * 6.5, r * 6.5, { color: GOLD, alpha: 0.1 });
        M.wash(ctx, x, y, r * 3, r * 3, { color: '#e8c85e', alpha: 0.26 });
        M.dot(ctx, x, y, r * 0.62, { color: '#f7ecc4', alpha: 0.95 });
        // 光后面拖一粒几乎看不见的虫身
        if (chance(0.45)) {
          var ba = rnd(-0.6, 0.6);
          M.stroke(ctx, [{ x: x - Math.cos(ba) * r * 3.4, y: y - Math.sin(ba) * r * 3.4 }, { x: x - Math.cos(ba) * r * 6, y: y - Math.sin(ba) * r * 6 }],
            { w: r * 0.5, w2: r * 0.1, alpha: 0.3, color: INK, profile: 'taper', seg: 5, cap: false });
        }
      }
      // 夜草：浓而干的一丛，压在最下面，光才浮得起来
      for (var g = 0; g < rint(12, 20); g++) {
        var gx = rnd(4, 96), gy = rnd(74, 98);
        var gh = rnd(10, 26);
        var pts = [{ x: gx, y: gy }, { x: gx + rnd(-3, 3), y: gy - gh * 0.55 }, { x: gx + rnd(-7, 7), y: gy - gh }];
        M.stroke(ctx, pts, { w: rnd(0.7, 1.5), w2: 0.1, alpha: rnd(0.4, 0.7), color: INK, profile: 'taper', seg: 8, dry: 0.5, cap: false });
      }
      M.moss(ctx, rnd(14, 40), rnd(90, 97), rint(5, 9), { spread: 8, alpha: 0.6 });
      M.wash(ctx, 50, 96, 52, 6, { color: INK, alpha: 0.14 });
    },

    /* ———— 器物建筑 ———— */
    boat: function (ctx) {
      var x = rnd(34, 68), y = rnd(56, 74), w = rnd(34, 54), tilt = rnd(-0.05, 0.05);
      var y1 = y + w * 0.05;
      // 船身：一道弧形浓墨 + 底下淡墨积
      var hull = [{ x: x - w * 0.5, y: y1 - w * 0.04 }, { x: x - w * 0.2, y: y1 + w * 0.08 },
        { x: x + w * 0.22, y: y1 + w * 0.09 }, { x: x + w * 0.52, y: y1 - w * 0.06 }];
      M.ink3(ctx, hull, { w: 2.6, w2: 1.2, alpha: 0.85, profile: 'flat', seg: 11, core: true, side: -1 });
      ctx.save();
      ctx.translate(x, y1); ctx.rotate(tilt);
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, -w * 0.04);
      ctx.quadraticCurveTo(-w * 0.1, w * 0.12, w * 0.52, -w * 0.05);
      ctx.quadraticCurveTo(0, w * 0.02, -w * 0.5, -w * 0.04);
      ctx.closePath();
      ctx.globalAlpha = 0.34; ctx.fillStyle = M.darken(INK, 0.7); ctx.fill();
      ctx.restore();
      // 乌篷：半圆的黑，带飞白
      if (chance(0.65)) {
        var pc = x - w * rnd(0.02, 0.16), pr = w * rnd(0.14, 0.2);
        var canopy = [];
        for (var a = 3.14; a >= 0; a -= 0.35) canopy.push({ x: pc + Math.cos(a) * pr, y: y1 - w * 0.03 - Math.sin(a) * pr * 0.8 });
        M.stroke(ctx, canopy, { w: 3.4, w2: 2.4, alpha: 0.88, color: M.darken(INK, 0.55), profile: 'flat', seg: 9, dry: 0.5 });
        for (var rib = 1; rib < 4; rib++) {
          var rt = rib / 4 * 3.14;
          M.stroke(ctx, [{ x: pc + Math.cos(3.14 - rt) * pr, y: y1 - w * 0.03 - Math.sin(rt) * pr * 0.8 },
            { x: pc + Math.cos(3.14 - rt) * pr, y: y1 - w * 0.02 }], { w: 0.6, alpha: 0.4, profile: 'flat' });
        }
      }
      // 艄公：一团身、一点头、一竿
      var fx = x + w * rnd(0.24, 0.4);
      M.blot(ctx, fx, y1 - w * 0.1, w * 0.06, { alpha: 0.85 });
      M.dot(ctx, fx + w * 0.01, y1 - w * 0.18, w * 0.03, { alpha: 0.9 });
      M.stroke(ctx, [{ x: fx + w * 0.06, y: y1 - w * 0.16 }, { x: fx + w * 0.3, y: y1 + w * 0.16 }],
        { w: 0.9, w2: 0.4, alpha: 0.8, profile: 'taper', seg: 8 });
      // 缆绳/篙入水的破墨
      M.stroke(ctx, [{ x: x - w * 0.52, y: y1 - w * 0.05 }, { x: x - w * 0.62, y: y1 + w * 0.1 }], { w: 0.7, alpha: 0.5, profile: 'taper' });
      // 倒影：断成几截横墨
      for (var d = 0; d < rint(5, 8); d++) {
        var dy = y1 + w * 0.12 + d * rnd(2.4, 4);
        var dw = w * 0.42 * (1 - d / 12);
        M.stroke(ctx, [{ x: x - dw + rnd(-3, 3), y: dy }, { x: x + dw + rnd(-3, 3), y: dy + rnd(-0.6, 0.6) }],
          { w: rnd(1.4, 3), w2: 0.6, alpha: rnd(0.1, 0.26), profile: 'flat', seg: 9, color: M.darken(INK, 0.8) });
      }
      // 水
      waterLines(ctx, y1 + w * 0.06, rint(4, 6), rnd(3.6, 5.4), {});
      // 船行一道尾波
      for (var k = 0; k < 3; k++) {
        M.stroke(ctx, [{ x: x - w * (0.6 + k * 0.2), y: y1 + w * (0.04 + k * 0.05) }, { x: x - w * 0.5, y: y1 + w * (0.08 + k * 0.04) }],
          { w: 1, w2: 0.3, alpha: 0.3 - k * 0.07, profile: 'flat', seg: 9 });
      }
      // 两岸芦苇或远山一角
      if (chance(0.6)) {
        var rx = chance(0.5) ? rnd(4, 14) : rnd(86, 96);
        var side = rx < 50 ? 1 : -1;
        for (var i = 0; i < rint(3, 4); i++) {
          var bx = rx + side * rnd(-5, 11), by = y1 + rnd(4, 12), hh = rnd(22, 40);
          M.stroke(ctx, [{ x: bx, y: by }, { x: bx + side * hh * 0.16, y: by - hh * 0.6 }, { x: bx + side * hh * rnd(0.36, 0.6), y: by - hh }],
            { w: 1.1, w2: 0.25, alpha: rnd(0.32, 0.55), profile: 'taper', seg: 9, dry: 0.55 });
          // 穗：梢上一小簇，压着风
          M.stroke(ctx, [{ x: bx + side * hh * 0.36, y: by - hh * 0.88 }, { x: bx + side * hh * 0.6, y: by - hh * 1.04 }],
            { w: rnd(1.8, 2.6), w2: 0.5, alpha: rnd(0.24, 0.42), color: M.darken(INK, 0.7), profile: 'taper', seg: 4, dry: 0.65, cap: false });
        }
        M.wash(ctx, rx, y1 - 6, 14, 16, { color: INK, alpha: 0.05 });
      } else {
        M.ridge(ctx, 40, 108, y - w * 0.9, rnd(10, 16), 8, { alpha: 0.13, lw: 0.5, seed: rnd(0, 6) });
      }
      M.air(ctx, x, y1, 30, 14, {});
    },

    bridge: function (ctx) {
      var y = rnd(54, 66), x0 = rnd(2, 14), x1 = rnd(86, 98);
      var span = x1 - x0, rise = rnd(13, 21), wl = y + 10;
      var n = 14, crown = [];
      for (var i = 0; i <= n; i++) {
        var t = i / n;
        crown.push({ x: x0 + span * t, y: y - Math.sin(t * Math.PI) * rise });
      }
      var road = M.smooth(crown, 5);
      var foot = road.map(function (p, idx) {
        return { x: p.x, y: p.y + 3.4 + Math.sin(idx / (road.length - 1) * Math.PI) * 1.6 };
      });
      // 石身：桥面以下是一整块石头，两端坐进水里。只画一道拱线是力学图，不是桥
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(road[0].x, wl + 6);
      for (var a = 0; a < road.length; a++) ctx.lineTo(road[a].x, road[a].y);
      ctx.lineTo(road[road.length - 1].x, wl + 6);
      ctx.closePath();
      var g = ctx.createLinearGradient(0, y - rise, 0, wl);
      g.addColorStop(0, M.colA(M.darken(INK, 0.8), 0.4));
      g.addColorStop(0.55, M.colA(INK, 0.26));
      g.addColorStop(1, M.colA(INK, 0.12));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      // 拱洞：从石身里挖出去，露出水
      var ax = (x0 + x1) / 2, aw = span * rnd(0.2, 0.3);
      var ah = (wl - y + rise) * rnd(0.48, 0.64);
      var hole = [];
      for (var h = 0; h <= 12; h++) {
        var ht = h / 12;
        hole.push({ x: ax - aw + 2 * aw * ht, y: wl + 3 - Math.sin(ht * Math.PI) * ah });
      }
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(hole[0].x, wl + 7);
      for (var h2 = 1; h2 < hole.length; h2++) ctx.lineTo(hole[h2].x, hole[h2].y);
      ctx.lineTo(hole[hole.length - 1].x, wl + 7);
      ctx.closePath();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
      // 券脸：贴洞一圈浓，外头再套一道淡的，拱才吃得住力
      M.stroke(ctx, hole, { w: 2.7, w2: 2.1, alpha: 0.74, color: M.darken(INK, 0.7), profile: 'flat', seg: 7, cap: false });
      M.stroke(ctx, hole.map(function (p) {
        var dx = p.x - ax, dy = p.y - (wl + 3);
        var l = Math.sqrt(dx * dx + dy * dy) || 1;
        return { x: p.x + dx / l * 2.2, y: p.y + dy / l * 2.2 };
      }), { w: 0.9, w2: 0.7, alpha: 0.3, color: INK, profile: 'flat', seg: 7, cap: false });
      // 桥面与石脚
      M.stroke(ctx, road, { w: 3.2, w2: 2.6, alpha: 0.7, color: M.darken(INK, 0.66), profile: 'flat', seg: 7, cap: false });
      M.stroke(ctx, foot, { w: 1.4, w2: 1, alpha: 0.36, color: M.darken(INK, 0.75), profile: 'flat', seg: 7, cap: false });
      // 栏：寻杖一道随桥面起伏，望柱间距略不齐，柱头一个莲
      var rail = road.map(function (p) { return { x: p.x, y: p.y - 5.6 }; });
      M.stroke(ctx, rail, { w: 1.2, w2: 1, alpha: 0.58, profile: 'flat', seg: 7, cap: false });
      for (var p3 = 1; p3 < road.length - 2; p3 += rint(3, 5)) {
        M.stroke(ctx, [{ x: road[p3].x, y: road[p3].y - 0.8 }, { x: rail[p3].x, y: rail[p3].y - 1.6 }],
          { w: 1.5, w2: 1.2, alpha: 0.66, color: M.darken(INK, 0.7), profile: 'flat', seg: 5, cap: false });
        M.dot(ctx, rail[p3].x, rail[p3].y - 2.2, 0.9, { alpha: 0.74 });
      }
      // 两端桥台与岸
      [[x0, -1], [x1, 1]].forEach(function (e) {
        M.stroke(ctx, [{ x: e[0], y: wl }, { x: e[0] + e[1] * 3, y: wl + 7 }, { x: e[0] + e[1] * 10, y: wl + 11 }],
          { w: 2.6, w2: 1, alpha: 0.68, color: M.darken(INK, 0.7), profile: 'flat', seg: 9 });
        M.moss(ctx, e[0] + e[1] * 8, wl + 9, 5, { spread: 7, min: 0.4, max: 1.1 });
      });
      // 洞下是水，留一片白，只画几道波纹
      waterLines(ctx, wl + 4, rint(3, 5), rnd(3.4, 4.8), {});
      for (var wv = 0; wv < rint(2, 4); wv++) {
        M.stroke(ctx, [{ x: x0 + span * rnd(0.2, 0.8), y: wl + rnd(0, 8) },
          { x: x0 + span * rnd(0.3, 0.9), y: wl + 2 + rnd(0, 6) }],
          { w: 1.6, w2: 0.4, alpha: rnd(0.14, 0.3), profile: 'flat', seg: 9 });
      }
      // 过桥的人：一两个墨点
      if (chance(0.7)) {
        var hx = x0 + span * rnd(0.3, 0.7);
        var hi = clamp(Math.round((hx - x0) / span * (road.length - 1)), 0, road.length - 1);
        var hh = road[hi];
        M.blot(ctx, hx, hh.y - 7, 1.9, { alpha: 0.86 });
        M.dot(ctx, hx, hh.y - 10.5, 1.1, { alpha: 0.88 });
        M.stroke(ctx, [{ x: hx - 1.4, y: hh.y - 5 }, { x: hx - 2.6, y: hh.y - 0.6 }], { w: 0.8, alpha: 0.78, profile: 'taper' });
        M.stroke(ctx, [{ x: hx + 1.4, y: hh.y - 5 }, { x: hx + 2.4, y: hh.y - 0.6 }], { w: 0.8, alpha: 0.78, profile: 'taper' });
      }
      // 桥头一株垂柳或杂树
      if (chance(0.6)) {
        var tx = chance(0.5) ? x0 - 2 : x1 + 2;
        M.stroke(ctx, [{ x: tx, y: wl + 6 }, { x: tx + M.sign() * 3, y: y - 8 }, { x: tx + M.sign() * 5, y: y - 24 }],
          { w: 2.8, w2: 0.9, alpha: 0.78, profile: 'taper', seg: 9, dry: 0.4 });
        for (var br = 0; br < rint(4, 7); br++) {
          M.blade(ctx, tx + rnd(-6, 8), y - rnd(12, 28), tx + rnd(-14, 16), y - rnd(2, 16), rnd(1.6, 2.8),
            { color: chance(0.4) ? GREEN : INK, alpha: rnd(0.35, 0.62) });
        }
      }
      M.wash(ctx, (x0 + x1) / 2, y - rise + 4, span * 0.5, rise * 1.4, { color: INK, alpha: 0.05 });
      M.air(ctx, (x0 + x1) / 2, wl, 40, 16, {});
    },

    pavilion: function (ctx) {
      var x = rnd(40, 60), y = rnd(62, 74), w = rnd(17, 25);
      var ph = w * rnd(1.15, 1.5), top = y - ph;
      // 台基两层，中间留踏道
      wall(ctx, x - w * 1.12, y, x + w * 1.12, y + w * 0.18, { alpha: 0.82 });
      wall(ctx, x - w * 0.94, y + w * 0.18, x + w * 0.94, y + w * 0.32, { alpha: 0.66 });
      // 檐下先立四柱，屋顶压下来才有承接
      [-1, 1].forEach(function (sd) {
        post(ctx, x + sd * w * 0.76, top + w * 0.12, y, w * 0.1, { alpha: 0.78 });
        post(ctx, x + sd * w * 0.28, top + w * 0.08, y, w * 0.08, { alpha: 0.6 });
      });
      // 里间一片阴，亭子不是空的
      M.wash(ctx, x, top + ph * 0.62, w * 0.66, ph * 0.34, { color: INK, alpha: 0.16 });
      // 楣子与美人靠
      M.stroke(ctx, [{ x: x - w * 0.84, y: top + w * 0.2 }, { x: x + w * 0.84, y: top + w * 0.2 }],
        { w: w * 0.06, w2: w * 0.045, alpha: 0.62, profile: 'flat', seg: 6, cap: false });
      M.stroke(ctx, [{ x: x - w * 0.72, y: y - w * 0.36 }, { x: x + w * 0.72, y: y - w * 0.36 }],
        { w: w * 0.045, w2: w * 0.035, alpha: 0.46, profile: 'flat', seg: 6, cap: false });
      var rf = eave(ctx, x, top, w * 1.12, { rise: 0.5, flick: 0.2, sag: 0.12, alpha: 0.88 });
      // 宝顶
      M.stroke(ctx, [{ x: rf.tip.x, y: rf.tip.y - w * 0.02 }, { x: rf.tip.x, y: rf.tip.y - w * 0.22 }],
        { w: w * 0.05, w2: w * 0.03, alpha: 0.82, profile: 'flat', seg: 5, cap: false });
      M.dot(ctx, rf.tip.x, rf.tip.y - w * 0.28, w * 0.055, { alpha: 0.86 });
      // 地脚一道，远处一抹山，亭子才立在景里
      M.stroke(ctx, [{ x: x - w * 2.4, y: y + w * 0.4 }, { x: x + w * 2.4, y: y + w * 0.4 }],
        { w: 1.3, w2: 0.3, alpha: 0.34, profile: 'flat', seg: 11 });
      if (chance(0.7)) M.ridge(ctx, chance(0.5) ? -6 : 52, chance(0.5) ? 54 : 112, y - w * rnd(0.4, 1), rnd(9, 16), 7, { alpha: 0.12, lw: 0.5, fade: true, seed: rnd(0, 6) });
      if (chance(0.55)) {
        var sx = chance(0.5) ? x - w * rnd(1.7, 2.6) : x + w * rnd(1.7, 2.6);
        M.stroke(ctx, [{ x: sx, y: y + w * 0.3 }, { x: sx + rnd(-1.5, 1.5), y: y - w * rnd(0.8, 1.4) },
          { x: sx + rnd(-3, 3), y: y - w * rnd(1.6, 2.4) }],
          { w: w * 0.09, w2: w * 0.03, alpha: 0.62, profile: 'taper', seg: 9, dry: 0.3 });
        M.moss(ctx, sx + rnd(-3, 3), y - w * rnd(2, 2.6), 9, { spread: w * 0.3, min: 0.4, max: 1.2, alpha: 0.7 });
      }
      M.wash(ctx, x, y + w * 0.5, w * 1.4, w * 0.16, { color: INK, alpha: 0.14 });
      M.air(ctx, x, top, w, ph, {});
    },

    pagoda: function (ctx, o) {
      o = o || {};
      var x = rnd(42, 58), y = rnd(78, 88), w = rnd(13, 19), tiers = o.tiers || rint(3, 6);
      var th = w * 0.66;
      // 一层墙、一片檐，往上收；檐压着上一层的脚，塔才是一栋栋叠起来的
      for (var i = 0; i < tiers; i++) {
        var ty = y - i * th, tw = w * (1 - i * 0.09);
        wall(ctx, x - tw * 0.5, ty - th * 0.8, x + tw * 0.5, ty, { alpha: 0.78 });
        // 券门：一层一个浓墨小洞，塔身才有进出
        if (i === 0 || chance(0.6)) {
          ctx.save();
          ctx.globalAlpha = 0.5 + i * 0.03;
          ctx.fillStyle = INK;
          ctx.beginPath();
          ctx.moveTo(x - tw * 0.12, ty - th * 0.06);
          ctx.lineTo(x - tw * 0.12, ty - th * 0.4);
          ctx.quadraticCurveTo(x, ty - th * 0.6, x + tw * 0.12, ty - th * 0.4);
          ctx.lineTo(x + tw * 0.12, ty - th * 0.06);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        eave(ctx, x, ty - th * 0.74, tw * 0.86, { rise: 0.3, flick: 0.14, sag: 0.08, alpha: 0.9 });
      }
      // 塔刹：一段仰莲、一根相轮、一颗宝珠
      var cy = y - tiers * th - w * 0.1;
      M.stroke(ctx, [{ x: x, y: cy }, { x: x, y: cy - w * 0.7 }], { w: w * 0.08, w2: w * 0.05, alpha: 0.82, profile: 'flat', seg: 6, cap: false });
      for (var r = 1; r <= 3; r++) {
        M.stroke(ctx, [{ x: x - w * (0.16 - r * 0.03), y: cy - w * 0.16 * r }, { x: x + w * (0.16 - r * 0.03), y: cy - w * 0.16 * r }],
          { w: w * 0.045, alpha: 0.7, profile: 'flat', seg: 4, cap: false });
      }
      M.dot(ctx, x, cy - w * 0.78, w * 0.07, { alpha: 0.86 });
      // 塔脚:一层台基 + 一片地
      wall(ctx, x - w * 0.86, y, x + w * 0.86, y + w * 0.2, { alpha: 0.7 });
      M.stroke(ctx, [{ x: x - w * 2.2, y: y + w * 0.34 }, { x: x + w * 2.2, y: y + w * 0.34 }],
        { w: 1.3, w2: 0.3, alpha: 0.34, profile: 'flat', seg: 11 });
      M.wash(ctx, x, y + w * 0.44, w * 1.5, w * 0.16, { color: INK, alpha: 0.16 });
      if (chance(0.7)) M.ridge(ctx, x - w * 4, x - w * 1.2, y - th * tiers * rnd(0.4, 0.9), rnd(8, 14), 6, { alpha: 0.11, lw: 0.5, fade: true, seed: rnd(0, 6) });
      if (chance(0.6)) {
        var sx = chance(0.5) ? x - w * rnd(1.5, 2.2) : x + w * rnd(1.5, 2.2);
        M.stroke(ctx, [{ x: sx, y: y + w * 0.2 }, { x: sx + rnd(-1, 1), y: y - w * rnd(0.8, 1.6) }],
          { w: w * 0.08, w2: w * 0.03, alpha: 0.6, profile: 'taper', seg: 9, dry: 0.3 });
        M.moss(ctx, sx, y - w * rnd(1.6, 2.2), 8, { spread: w * 0.26, min: 0.4, max: 1.1, alpha: 0.72 });
      }
      M.air(ctx, x, y - tiers * th * 0.5, w * 1.2, tiers * th * 0.5, {});
    },

    house: function (ctx) {
      var x = rnd(36, 60), y = rnd(62, 76), w = rnd(19, 28), h = w * rnd(0.5, 0.66);
      var ey = y - h * 0.12;                       // 檐口
      // 墙：白粉墙，脚下一道浓
      wall(ctx, x - w * 0.7, ey, x + w * 0.7, y, { alpha: 0.85 });
      // 门与窗：门是黑的，窗留白加几道棂
      var dw = w * 0.2;
      ctx.save();
      ctx.globalAlpha = 0.62; ctx.fillStyle = INK;
      ctx.fillRect(x - dw / 2 + w * 0.16, y - h * 0.62, dw, h * 0.62);
      ctx.restore();
      var wx = x - w * 0.38, wy = y - h * 0.5, ww = w * 0.24, wh = h * 0.34;
      ctx.save();
      ctx.globalAlpha = 0.5; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(0.5, w * 0.018);
      ctx.strokeRect(wx - ww / 2, wy - wh / 2, ww, wh);
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(wx, wy - wh / 2); ctx.lineTo(wx, wy + wh / 2);
      ctx.moveTo(wx - ww / 2, wy); ctx.lineTo(wx + ww / 2, wy);
      ctx.stroke();
      ctx.restore();
      // 屋顶压住墙头，两头挑出山墙
      var rf = eave(ctx, x, ey, w * 0.82, { rise: 0.42, flick: 0.13, sag: 0.05, alpha: 0.88 });
      // 山墙上的马头：一道比屋顶低的直墙，皖南的味道
      if (chance(0.5)) {
        [[-1], [1]].forEach(function (sd) {
          var mx = x + sd[0] * w * 0.72;
          M.stroke(ctx, [{ x: mx, y: y }, { x: mx, y: ey - h * rnd(0.1, 0.3) }],
            { w: w * 0.05, w2: w * 0.03, alpha: 0.6, profile: 'flat', seg: 6, cap: false });
        });
      }
      // 屋后一丛竹或一棵树，房子才有人住
      if (chance(0.65)) {
        var bx = chance(0.5) ? x - w * rnd(1, 1.5) : x + w * rnd(1, 1.5);
        for (var b = 0; b < rint(2, 4); b++) {
          var bxx = bx + rnd(-w * 0.3, w * 0.3);
          M.stroke(ctx, [{ x: bxx, y: y + 2 }, { x: bxx + rnd(-1.5, 1.5), y: y - h * rnd(1.4, 2.4) }],
            { w: w * 0.035, w2: w * 0.02, alpha: rnd(0.35, 0.6), profile: 'flat', seg: 7, cap: false });
          for (var lf = 0; lf < 4; lf++) {
            taperLeaf(ctx, bxx, y - h * rnd(0.6, 2.2), rnd(-2.9, -0.3), rnd(2, 4.5), rnd(0.5, 0.9),
              { color: INK, alpha: rnd(0.3, 0.5), bend: rnd(-0.2, 0.2) });
          }
        }
      }
      // 炊烟一缕
      if (chance(0.55)) {
        M.stroke(ctx, [{ x: x + w * 0.24, y: rf.tip.y + h * 0.1 }, { x: x + w * 0.3, y: rf.tip.y - h * 0.5 },
          { x: x + w * 0.2, y: rf.tip.y - h * 1.1 }, { x: x + w * 0.34, y: rf.tip.y - h * 1.7 }],
          { w: w * 0.06, w2: w * 0.01, alpha: 0.2, color: INK, profile: 'taper', seg: 9 });
      }
      M.stroke(ctx, [{ x: x - w * 1.7, y: y + 1 }, { x: x + w * 1.7, y: y + 1 }],
        { w: 1.3, w2: 0.3, alpha: 0.34, profile: 'flat', seg: 11 });
      M.moss(ctx, x - w * 0.62, y, 6, { spread: w * 0.14, min: 0.3, max: 0.9, alpha: 0.6 });
      M.wash(ctx, x, y + h * 0.22, w * 1.1, h * 0.16, { color: INK, alpha: 0.14 });
      M.air(ctx, x, ey - h * 0.3, w, h, {});
    },

    gate: function (ctx) {
      var x = rnd(38, 62), y = rnd(66, 78), w = rnd(21, 30), h = w * rnd(0.6, 0.78);
      // 门墙一整道，中间挖一个券洞；洞是黑的，墙才亮
      wall(ctx, x - w * 0.82, y - h, x + w * 0.82, y, { alpha: 0.86 });
      var aw = w * 0.28, ah = h * 0.8;
      ctx.save();
      ctx.globalAlpha = 0.7; ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(x - aw / 2, y);
      ctx.lineTo(x - aw / 2, y - ah + aw / 2);
      ctx.arc(x, y - ah + aw / 2, aw / 2, Math.PI, 0);
      ctx.lineTo(x + aw / 2, y);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      // 墙头一道檐枋，其上再覆一间小屋
      M.stroke(ctx, [{ x: x - w * 0.9, y: y - h }, { x: x + w * 0.9, y: y - h }],
        { w: w * 0.07, w2: w * 0.05, alpha: 0.72, color: M.darken(INK, 0.7), profile: 'flat', seg: 8, cap: false });
      var gy = y - h - w * 0.02;
      wall(ctx, x - w * 0.44, gy - h * 0.42, x + w * 0.44, gy, { alpha: 0.7 });
      [-1, 1].forEach(function (sd) { post(ctx, x + sd * w * 0.34, gy - h * 0.4, gy, w * 0.06, { alpha: 0.6 }); });
      eave(ctx, x, gy - h * 0.36, w * 0.62, { rise: 0.4, flick: 0.16, sag: 0.08, alpha: 0.9 });
      // 门前石阶与地上的苔
      for (var st = 0; st < 3; st++) {
        M.stroke(ctx, [{ x: x - aw / 2 - w * 0.04 - st * w * 0.05, y: y + st * w * 0.05 },
          { x: x + aw / 2 + w * 0.04 + st * w * 0.05, y: y + st * w * 0.05 }],
          { w: w * 0.03, alpha: 0.4 - st * 0.06, profile: 'flat', seg: 5, cap: false });
      }
      M.stroke(ctx, [{ x: x - w * 1.8, y: y + w * 0.16 }, { x: x + w * 1.8, y: y + w * 0.16 }],
        { w: 1.3, w2: 0.3, alpha: 0.32, profile: 'flat', seg: 11 });
      M.moss(ctx, x - w * 0.7, y - h * 0.06, 7, { spread: w * 0.12, min: 0.3, max: 0.9, alpha: 0.55 });
      if (chance(0.6)) {
        var sx = chance(0.5) ? x - w * rnd(1.2, 1.8) : x + w * rnd(1.2, 1.8);
        M.stroke(ctx, [{ x: sx, y: y + w * 0.1 }, { x: sx + rnd(-1, 1), y: y - h * rnd(0.8, 1.3) },
          { x: sx + rnd(-2, 2), y: y - h * rnd(1.6, 2.2) }],
          { w: w * 0.08, w2: w * 0.025, alpha: 0.6, profile: 'taper', seg: 9, dry: 0.3 });
        M.moss(ctx, sx, y - h * rnd(1.8, 2.3), 9, { spread: w * 0.24, min: 0.4, max: 1.2, alpha: 0.7 });
      }
      M.wash(ctx, x, y + w * 0.24, w * 1.2, w * 0.14, { color: INK, alpha: 0.14 });
      M.air(ctx, x, y - h * 0.5, w * 0.8, h * 0.6, {});
    },
    window: function (ctx) {
      var w = rnd(20, 30), h = w * rnd(0.75, 1.05);
      var x = rnd(24 + w * 0.75, 76 - w * 0.75), y = rnd(36, 56);
      var x0 = x - w / 2, y0 = y - h / 2;
      // 窗是墙上的一个洞：先立一面墙，再挖
      var wl = x - w * 1.15, wr = x + w * 1.15, wt = y - h * 0.92, wb = y + h * 1.32;
      wall(ctx, wl, wt, wr, wb, { alpha: 0.66 });
      // 墙头压一道檐，脚下走一条地平：没有这两笔，墙就是一块浮着的灰板
      M.stroke(ctx, [{ x: wl - w * 0.16, y: wt }, { x: x, y: wt - h * 0.06 }, { x: wr + w * 0.16, y: wt }],
        { w: w * 0.09, w2: w * 0.05, alpha: 0.6, color: M.darken(INK, 0.72), profile: 'flat', seg: 8, cap: false, dry: 0.35 });
      for (var ti = 0; ti < rint(7, 12); ti++) {
        var tix = wl + (wr - wl) * rnd(0, 1);
        M.stroke(ctx, [{ x: tix, y: wt - h * 0.02 }, { x: tix + rnd(-1, 1), y: wt + h * rnd(0.06, 0.14) }],
          { w: 0.7, w2: 0.2, alpha: rnd(0.2, 0.36), color: M.darken(INK, 0.6), profile: 'flat', seg: 3, cap: false });
      }
      M.stroke(ctx, [{ x: 2, y: wb }, { x: x, y: wb + rnd(-1, 1.4) }, { x: 98, y: wb + rnd(-1, 1) }],
        { w: 1.4, w2: 0.4, alpha: 0.3, profile: 'flat', seg: 14, dry: 0.55, cap: false });
      ctx.save();
      var lg = ctx.createLinearGradient(0, y0, 0, y0 + h);
      lg.addColorStop(0, 'rgba(255,251,238,0.78)');
      lg.addColorStop(1, 'rgba(255,251,238,0.4)');
      ctx.fillStyle = lg;
      ctx.fillRect(x0, y0, w, h);
      ctx.restore();
      // 棂格：直棂或冰裂，笔要有粗细
      var lw = w * 0.035;
      if (chance(0.45)) {
        for (var i = 0; i < rint(4, 6); i++) {
          var ax = x0 + rnd(0.08, 0.92) * w, ay = y0 + rnd(0.08, 0.92) * h;
          M.stroke(ctx, [{ x: ax, y: ay },
            { x: ax + rnd(-0.34, 0.34) * w, y: ay + rnd(-0.3, 0.3) * h },
            { x: ax + rnd(-0.5, 0.5) * w, y: ay + rnd(-0.44, 0.44) * h }],
            { w: lw, w2: lw * 0.7, alpha: 0.55, profile: 'flat', seg: 6, cap: false });
        }
      } else {
        for (var v = 1; v < 4; v++) {
          M.stroke(ctx, [{ x: x0 + w * v / 4, y: y0 + h * 0.04 }, { x: x0 + w * v / 4, y: y0 + h * 0.96 }],
            { w: lw, w2: lw * 0.8, alpha: 0.55, profile: 'flat', seg: 5, cap: false });
        }
        M.stroke(ctx, [{ x: x0 + w * 0.04, y: y }, { x: x0 + w * 0.96, y: y }],
          { w: lw, w2: lw * 0.8, alpha: 0.5, profile: 'flat', seg: 5, cap: false });
      }
      // 外框：四笔浓墨，转角重压
      [[y0, 1], [y0 + h, 1]].forEach(function (row) {
        M.stroke(ctx, [{ x: x0 - w * 0.03, y: row[0] }, { x: x0 + w * 1.03, y: row[0] }],
          { w: w * 0.06, w2: w * 0.05, alpha: 0.78, color: M.darken(INK, 0.7), profile: 'flat', seg: 7, cap: false });
      });
      [[x0, 1], [x0 + w, 1]].forEach(function (col) {
        M.stroke(ctx, [{ x: col[0], y: y0 - h * 0.03 }, { x: col[0], y: y0 + h * 1.03 }],
          { w: w * 0.055, w2: w * 0.045, alpha: 0.74, color: M.darken(INK, 0.7), profile: 'flat', seg: 7, cap: false });
      });
      // 窗台：一块石，下面压一道影
      M.stroke(ctx, [{ x: x0 - w * 0.12, y: y0 + h + h * 0.06 }, { x: x0 + w * 1.12, y: y0 + h + h * 0.06 }],
        { w: w * 0.075, w2: w * 0.05, alpha: 0.7, color: M.darken(INK, 0.66), profile: 'flat', seg: 7, cap: false });
      M.wash(ctx, x, y0 + h + h * 0.24, w * 0.8, h * 0.14, { color: INK, alpha: 0.2 });
      // 窗外一角竹或一枝梅，格子才有景
      if (chance(0.55)) {
        for (var b = 0; b < rint(2, 3); b++) {
          var bx = x + rnd(-w * 0.3, w * 0.3);
          M.stroke(ctx, [{ x: bx, y: y0 + h * 0.9 }, { x: bx + rnd(-1, 1), y: y0 - h * rnd(0.2, 0.6) }],
            { w: w * 0.028, w2: w * 0.018, alpha: 0.3, profile: 'flat', seg: 6, cap: false });
          for (var lf = 0; lf < 3; lf++) {
            taperLeaf(ctx, bx, y0 + rnd(-h * 0.4, h * 0.3), rnd(-2.9, -0.4), rnd(1.6, 3), rnd(0.4, 0.7),
              { color: INK, alpha: rnd(0.22, 0.34), bend: rnd(-0.2, 0.2) });
          }
        }
      }
      M.air(ctx, x, y, w, h, {});
    },

    lamp: function (ctx) {
      var x = rnd(40, 60), y = rnd(34, 50), r = rnd(10, 15);
      // 光先洇开，纸上有温度
      M.wash(ctx, x, y, r * 3.1, r * 3.1, { color: '#c8642f', alpha: 0.13 });
      // 瓜形灯身：一层红 + 几道同心竖骨
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.82, r, 0, 0, 6.2832);
      var g = ctx.createRadialGradient(x - r * 0.26, y - r * 0.3, r * 0.12, x, y, r * 1.06);
      g.addColorStop(0, M.colA('#d4623a', 0.6));
      g.addColorStop(0.66, M.colA(RED, 0.46));
      g.addColorStop(1, M.colA(M.darken(RED, 0.62), 0.56));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.clip();
      ctx.strokeStyle = M.colA(M.darken(RED, 0.5), 0.36);
      ctx.lineWidth = Math.max(0.3, r * 0.03);
      for (var i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.82 * i / 4, r, 0, 0, 6.2832);
        ctx.stroke();
      }
      ctx.restore();
      // 轮廓：一笔红边压住洇出去的光
      var ring = [];
      for (var a = 0; a < 26; a++) {
        var t = a / 26 * 6.2832;
        ring.push({ x: x + Math.cos(t) * r * 0.82, y: y + Math.sin(t) * r });
      }
      M.stroke(ctx, ring, { w: r * 0.07, w2: r * 0.05, alpha: 0.6, color: M.darken(RED, 0.6), profile: 'flat', seg: 5, cap: false });
      // 上下两道箍
      [[-1], [1]].forEach(function (sd) {
        M.stroke(ctx, [{ x: x - r * 0.56, y: y + sd[0] * r * 0.98 }, { x: x + r * 0.56, y: y + sd[0] * r * 0.98 }],
          { w: r * 0.11, w2: r * 0.09, alpha: 0.78, color: M.darken(INK, 0.7), profile: 'flat', seg: 5, cap: false });
      });
      // 挂绳与提梁
      M.stroke(ctx, [{ x: x, y: y - r }, { x: x + rnd(-1, 1), y: y - r - rnd(9, 15) }],
        { w: r * 0.05, w2: r * 0.04, alpha: 0.6, profile: 'flat', seg: 6, cap: false });
      // 穗：三缕丝，长短不齐才垂得自然
      for (var k = 0; k < 3; k++) {
        var tx = x + (k - 1) * r * 0.34;
        var tl = rnd(r * 0.5, r * 0.95);
        M.stroke(ctx, [{ x: tx, y: y + r }, { x: tx + rnd(-1, 1), y: y + r + tl * 0.6 }, { x: tx + rnd(-1.6, 1.6), y: y + r + tl }],
          { w: r * 0.05, w2: r * 0.012, alpha: 0.66, color: RED, profile: 'taper', seg: 6, cap: false });
      }
      M.dot(ctx, x, y + r * 1.06, r * 0.09, { color: M.darken(INK, 0.6), alpha: 0.8 });
      // 灯下一句题字似的小影，留白不空
      M.wash(ctx, x, y + r * 2.4, r * 1.4, r * 0.24, { color: INK, alpha: 0.1 });
      M.air(ctx, x, y, r * 1.2, r * 1.4, {});
    },

    umbrella: function (ctx) {
      // 油纸伞：侧看是半只斗笠，伞缘必须是一条椭圆，不是一条平线
      var x = rnd(38, 60), y = rnd(40, 52), r = rnd(20, 27);
      var ry = r * rnd(0.18, 0.26);
      var apex = { x: x + rnd(-r * 0.04, r * 0.04), y: y - r * 0.72 };
      var tilt = rnd(-0.14, 0.14);
      var col = chance(0.5) ? RED : '#4a4238';
      function rimA(t) {
        var a = t * 6.2832;
        return { x: x + Math.cos(a) * r, y: y + Math.sin(a) * ry, f: Math.sin(a) };
      }
      // 伞面：后缘走顶、前缘走底，闭合成一片斗笠
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.quadraticCurveTo(x - r * 0.5, apex.y + r * 0.02, apex.x, apex.y);
      ctx.quadraticCurveTo(x + r * 0.5, apex.y + r * 0.02, x + r, y);
      for (var i = 0; i <= 40; i++) {
        var p = rimA(i / 40);
        ctx.lineTo(p.x, p.y + (p.f > 0 ? Math.abs(Math.sin(i / 40 * Math.PI * 10)) * ry * 0.28 : 0));
      }
      ctx.closePath();
      var g = ctx.createLinearGradient(0, apex.y, 0, y + ry);
      g.addColorStop(0, M.colA(M.lighten(col, 1.5), 0.5));
      g.addColorStop(0.55, M.colA(col, 0.4));
      g.addColorStop(1, M.colA(M.darken(col, 0.6), 0.46));
      ctx.fillStyle = g; ctx.fill();
      // 骨：从顶一根根撑到缘，只画看得见的前半圈
      ctx.clip();
      ctx.strokeStyle = M.colA(M.darken(col, 0.75), 0.42);
      ctx.lineWidth = Math.max(0.3, r * 0.016);
      var nb = 9;
      for (var b = 0; b < nb; b++) {
        var q = rimA(0.5 + b / (nb - 1) * 0.5);
        ctx.beginPath();
        ctx.moveTo(apex.x, apex.y);
        ctx.quadraticCurveTo((apex.x + q.x) / 2, apex.y + (q.y - apex.y) * 0.3, q.x, q.y);
        ctx.stroke();
      }
      // 伞面上两团旧色，新纸伞是假的
      for (var m0 = 0; m0 < rint(2, 4); m0++) {
        M.wash(ctx, x + rnd(-r * 0.7, r * 0.7), y - rnd(0, r * 0.5), r * rnd(0.16, 0.34), ry * rnd(1, 2.2),
          { color: M.darken(col, 0.7), alpha: rnd(0.08, 0.16) });
      }
      ctx.restore();
      // 伞缘：前半圈浓、后半圈淡，边缘起伏才数得清骨
      var front = [], back = [];
      for (var e = 0; e <= 48; e++) {
        var t2 = e / 48, pe = rimA(t2);
        var wob = Math.abs(Math.sin(t2 * Math.PI * nb)) * ry * 0.3;
        (pe.f > 0 ? front : back).push({ x: pe.x, y: pe.y + (pe.f > 0 ? wob : 0) });
      }
      M.stroke(ctx, back, { w: r * 0.03, w2: r * 0.015, alpha: 0.3, color: M.darken(col, 0.7), profile: 'flat', seg: 6, cap: false });
      M.stroke(ctx, front, { w: r * 0.05, w2: r * 0.02, alpha: 0.72, color: M.darken(col, 0.75), profile: 'flat', seg: 6, cap: false, dry: 0.3 });
      // 柄：从顶直贯到底，下面留一截竹把；末端不弯钩，弯了就是拐杖
      var bot = y + r * rnd(1.15, 1.4);
      M.stroke(ctx, [{ x: apex.x, y: apex.y - r * 0.12 }, { x: x + tilt * r, y: y + ry * 0.4 },
        { x: x + tilt * r * 2.2, y: bot }],
        { w: r * 0.045, w2: r * 0.03, alpha: 0.8, color: '#4a3f30', profile: 'flat', seg: 8, cap: false });
      M.stroke(ctx, [{ x: x + tilt * r * 2.2, y: bot }, { x: x + tilt * r * 2.4, y: bot + r * 0.16 }],
        { w: r * 0.06, w2: r * 0.03, alpha: 0.7, color: '#6b5a3c', profile: 'flat', seg: 5, cap: false });
      // 伞顶：一小截骨帽
      M.stroke(ctx, [{ x: apex.x, y: apex.y - r * 0.12 }, { x: apex.x, y: apex.y + r * 0.04 }],
        { w: r * 0.055, w2: r * 0.02, alpha: 0.75, color: M.darken(INK, 0.7), profile: 'flat', seg: 4, cap: false });
      // 伞下露半个人：一顶笠、一道肩，不是地上一个墨点
      if (chance(0.65)) {
        var fx = x + tilt * r * 1.6 + rnd(-r * 0.16, r * 0.16), fy = y + r * 0.72;
        M.stroke(ctx, [{ x: fx - r * 0.4, y: fy + r * 0.1 }, { x: fx, y: fy - r * 0.2 }, { x: fx + r * 0.4, y: fy + r * 0.1 }],
          { w: r * 0.05, w2: r * 0.02, alpha: 0.5, profile: 'flat', seg: 6, cap: false });
        M.wash(ctx, fx, fy + r * 0.42, r * 0.4, r * 0.4, { color: INK, alpha: 0.3 });
        M.dot(ctx, fx, fy - r * 0.02, r * 0.1, { alpha: 0.62 });
      }
      // 几滴从檐口滑下去的水
      for (var d = 0; d < rint(2, 5); d++) {
        var dp = rimA(rnd(0.5, 1));
        var dl = rnd(3, 8);
        M.stroke(ctx, [{ x: dp.x, y: dp.y + ry * 0.3 }, { x: dp.x + rnd(-0.6, 0.6), y: dp.y + ry * 0.3 + dl }],
          { w: 0.6, w2: 0.15, alpha: rnd(0.24, 0.44), color: BLUE, profile: 'taper', seg: 4, cap: false });
      }
      M.stroke(ctx, [{ x: 6, y: bot + r * 0.2 }, { x: x, y: bot + r * 0.2 + rnd(-0.8, 1) }, { x: 94, y: bot + r * 0.18 }],
        { w: 1.2, w2: 0.35, alpha: 0.24, profile: 'flat', seg: 12, dry: 0.55, cap: false });
      M.wash(ctx, x + tilt * r * 2.2, bot + r * 0.26, r * 0.8, r * 0.09, { color: INK, alpha: 0.2 });
      M.air(ctx, x - r * 1.1, y - r * 0.4, r * 0.7, r * 0.4, {});
    },
    book: function (ctx) {
      // 书：一函线装摊在案上。描一个方框就是图标，要画出纸层、书脊和订线
      var x = rnd(38, 58), y = rnd(56, 70), w = rnd(28, 38), h = w * 0.68;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rnd(-0.1, 0.1));
      var x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
      // 底下那册只露出纸口，三层长短不齐
      for (var i = 0; i < rint(3, 4); i++) {
        var o = h * (0.07 + i * 0.055);
        M.stroke(ctx, [{ x: x0 + w * 0.04, y: y1 + o }, { x: x1 - w * 0.03, y: y1 + o * rnd(0.72, 1.08) }],
          { w: 1.2 - i * 0.22, w2: 0.3, alpha: 0.36 - i * 0.06, profile: 'flat', seg: 10, cap: false });
      }
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.closePath();
      var bg = ctx.createLinearGradient(x0, y0, x1, y1);
      bg.addColorStop(0, M.colA('#e9dfc4', 0.74));
      bg.addColorStop(1, M.colA('#c0b190', 0.56));
      ctx.fillStyle = bg; ctx.fill();
      // 四边分四笔走，粗细干湿不同才不像尺子画的
      var eg = [[{ x: x0, y: y0 }, { x: x1, y: y0 + rnd(-1, 1) }], [{ x: x1, y: y0 }, { x: x1 + rnd(-1, 1), y: y1 }],
        [{ x: x1, y: y1 }, { x: x0, y: y1 + rnd(-1, 1) }], [{ x: x0, y: y1 }, { x: x0 + rnd(-0.8, 0.8), y: y0 }]];
      for (var e = 0; e < 4; e++) {
        M.stroke(ctx, eg[e], { w: e === 3 ? 2.4 : 1.3, w2: e === 3 ? 1.6 : 0.5, alpha: e === 3 ? 0.62 : 0.42,
          color: e === 3 ? '#4a4038' : INK, profile: 'flat', seg: (e === 0 || e === 2) ? 12 : 7, dry: 0.3, cap: false });
      }
      // 书脑四道订线，红线
      for (var s = 0; s < 4; s++) {
        var sy = y0 + h * (0.16 + s * 0.23);
        M.stroke(ctx, [{ x: x0 + w * 0.03, y: sy }, { x: x0 + w * 0.16, y: sy + rnd(-1, 1) }],
          { w: 0.9, w2: 0.4, alpha: 0.55, color: '#8a4038', profile: 'flat', seg: 4, cap: false });
      }
      // 题签一条，上面落两三字
      var qw = w * 0.14, qx = x1 - qw * 1.9;
      ctx.fillStyle = M.colA('#f6efdc', 0.78);
      ctx.fillRect(qx, y0 + h * 0.14, qw, h * 0.72);
      M.stroke(ctx, [{ x: qx, y: y0 + h * 0.14 }, { x: qx, y: y0 + h * 0.86 }], { w: 0.7, w2: 0.3, alpha: 0.4, profile: 'flat', seg: 4, cap: false });
      M.stroke(ctx, [{ x: qx + qw, y: y0 + h * 0.14 }, { x: qx + qw, y: y0 + h * 0.86 }], { w: 0.7, w2: 0.3, alpha: 0.4, profile: 'flat', seg: 4, cap: false });
      var gs = rint(2, 4), gk = M.pick(['古', '诗', '文', '书', '画']), ga = M.pick(['词', '集', '谱', '抄']);
      for (var g = 0; g < gs; g++) {
        M.glyph(ctx, g === 0 ? gk : (g === 1 ? ga : M.pick(['之', '一', '山', '水'])), qx + qw * 0.5, y0 + h * (0.28 + g * 0.19), qw * 0.72, { alpha: 0.55 });
      }
      ctx.restore();
      M.wash(ctx, x, y + h * 0.72, w * 0.7, h * 0.12, { color: INK, alpha: 0.14 });
      M.air(ctx, x + w * 0.7, y - h * 0.8, 14, 8, {});
    },

    scroll: function (ctx) {
      // 挂轴：天杆细、地杆粗，绫边包住画心。描框就是图标
      var w = rnd(24, 32), h = w * rnd(1.5, 1.9), x = rnd(40, 58), y = rnd(22, 32);
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rnd(-0.04, 0.04));
      var x0 = -w / 2, x1 = w / 2, y0 = 0, y1 = h;
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.closePath();
      var sg = ctx.createLinearGradient(x0, y0, x1, y1);
      sg.addColorStop(0, M.colA('#d9d2bd', 0.62));
      sg.addColorStop(1, M.colA('#a9a08a', 0.44));
      ctx.fillStyle = sg; ctx.fill();
      // 边四笔，左右淡、下缘压重
      var eg = [[{ x: x0, y: y0 }, { x: x1, y: y0 }], [{ x: x1, y: y0 }, { x: x1, y: y1 }],
        [{ x: x1, y: y1 }, { x: x0, y: y1 }], [{ x: x0, y: y1 }, { x: x0, y: y0 }]];
      for (var e = 0; e < 4; e++) {
        M.stroke(ctx, eg[e], { w: e === 2 ? 1.8 : 1.1, w2: 0.4, alpha: e === 2 ? 0.5 : 0.34, profile: 'flat', seg: 10, dry: 0.3, cap: false });
      }
      // 画心：内缩一圈，纸色亮一档
      var mx = w * 0.16, my = h * 0.12;
      ctx.beginPath();
      ctx.moveTo(x0 + mx, y0 + my); ctx.lineTo(x1 - mx, y0 + my); ctx.lineTo(x1 - mx, y1 - my); ctx.lineTo(x0 + mx, y1 - my); ctx.closePath();
      ctx.fillStyle = M.colA('#f4ecd8', 0.8); ctx.fill();
      ctx.save(); ctx.clip();
      // 心里只放一小景：远山一道、近坡一撮、苔几点
      M.wash(ctx, 0, y0 + my + h * 0.3, w * 0.34, h * 0.12, { color: INK, alpha: 0.1 });
      M.ridge(ctx, x0 + mx * 1.4, x1 - mx * 1.4, y0 + my + h * 0.42, h * 0.14, 6, { alpha: 0.26, lw: 0.5, fade: true, seed: rnd(0, 6) });
      M.stroke(ctx, [{ x: x0 + mx * 1.6, y: y1 - my * 1.6 }, { x: x1 - mx * 1.8, y: y1 - my * 1.9 }],
        { w: 1.2, w2: 0.4, alpha: 0.34, profile: 'flat', seg: 8, cap: false });
      M.moss(ctx, x0 + mx * 2.2, y1 - my * 2.2, rint(3, 5), { spread: 2, min: 0.25, max: 0.55, alpha: 0.5 });
      M.seal(ctx, x1 - mx * 1.9, y1 - my * 2.4, w * 0.13, w * 0.13, '印', { size: w * 0.09, alpha: 0.7 });
      ctx.restore();
      // 天杆细、地杆粗，两头都出轴头
      M.stroke(ctx, [{ x: x0 - w * 0.1, y: y0 }, { x: x1 + w * 0.1, y: y0 }], { w: 2.2, w2: 1.4, alpha: 0.7, color: '#4a4038', profile: 'flat', seg: 8, cap: false });
      M.stroke(ctx, [{ x: x0 - w * 0.14, y: y1 }, { x: x1 + w * 0.14, y: y1 }], { w: 3.6, w2: 2.6, alpha: 0.75, color: '#3f3a32', profile: 'flat', seg: 9, cap: false });
      M.dot(ctx, x0 - w * 0.16, y1, w * 0.06, { color: '#3f3a32', alpha: 0.7 });
      M.dot(ctx, x1 + w * 0.16, y1, w * 0.06, { color: '#3f3a32', alpha: 0.7 });
      // 挂绳两笔并到一钩
      M.stroke(ctx, [{ x: x0 + w * 0.16, y: y0 }, { x: 0, y: y0 - h * 0.14 }], { w: 0.8, w2: 0.4, alpha: 0.45, profile: 'flat', seg: 5, cap: false });
      M.stroke(ctx, [{ x: x1 - w * 0.16, y: y0 }, { x: 0, y: y0 - h * 0.14 }], { w: 0.8, w2: 0.4, alpha: 0.45, profile: 'flat', seg: 5, cap: false });
      ctx.restore();
      M.wash(ctx, x + w * 0.1, y + h * 1.1, w * 0.5, h * 0.05, { color: INK, alpha: 0.12 });
      M.air(ctx, x - w * 0.8, y + h * 0.3, 14, 8, {});
    },

    brush: function (ctx) {
      // 笔：竹竿有节，笔斗收住，锋上吸饱了墨。一根黑棍加一点墨就是箭头
      var x = rnd(40, 58), y = rnd(24, 36), L = rnd(40, 52), a = rnd(-0.45, 0.45);
      ctx.save();
      ctx.translate(x, y); ctx.rotate(a);
      // 竿：一笔到底，微微起顿
      M.stroke(ctx, [{ x: 0, y: 0 }, { x: rnd(-0.6, 0.6), y: L * 0.66 }],
        { w: 2.8, w2: 2.4, alpha: 0.6, color: '#6a5f4b', profile: 'flat', seg: 10, dry: 0.3, cap: false });
      // 两节
      for (var n = 0; n < 2; n++) {
        var ny = L * (0.2 + n * 0.24);
        M.stroke(ctx, [{ x: -1.8, y: ny }, { x: 1.8, y: ny + rnd(-0.4, 0.4) }], { w: 1.1, w2: 0.6, alpha: 0.5, color: '#4a4238', profile: 'flat', seg: 4, cap: false });
      }
      // 挂绳一小圈
      M.stroke(ctx, [{ x: 0, y: -1 }, { x: -1.6, y: -4 }, { x: 0.4, y: -6.5 }, { x: 2, y: -4 }],
        { w: 0.8, w2: 0.4, alpha: 0.4, color: '#7a6a52', profile: 'flat', seg: 5, cap: false });
      // 笔斗
      M.stroke(ctx, [{ x: 0, y: L * 0.66 }, { x: 0, y: L * 0.75 }], { w: 4.4, w2: 3.8, alpha: 0.72, color: '#3f3a32', profile: 'flat', seg: 4, cap: false });
      // 锋：根粗梢尖，湿墨聚在尖上
      taperLeaf(ctx, 0, L * 0.75, 1.5708, L * 0.26, 4.4, { color: '#3b362e', alpha: 0.62, bend: 0.05 });
      taperLeaf(ctx, 0, L * 0.79, 1.5708, L * 0.21, 2.6, { color: '#1e1a16', alpha: 0.85, bend: 0.03 });
      ctx.restore();
      // 刚写下的一横：起笔湿、收笔飞白
      var tx = x + Math.sin(a) * L, ty = y + Math.cos(a) * L;
      var sx = tx + rnd(-4, 10), sy = ty + rnd(6, 14);
      M.stroke(ctx, [{ x: sx - 15, y: sy + rnd(-1, 1) }, { x: sx, y: sy - rnd(0, 2) }, { x: sx + 16, y: sy + rnd(0, 3) }],
        { w: 5.2, w2: 1.4, alpha: 0.62, color: INK, profile: 'swell', seg: 12, dry: 0.55, bleed: 0.4, cap: true });
      M.blot(ctx, sx + 17, sy + 2, 2.6, { alpha: 0.42 });
      M.splatter(ctx, sx + 12, sy, 12, 6, { alpha: 0.3, max: 0.8 });
      M.wash(ctx, sx, sy + 5, 18, 2.4, { color: INK, alpha: 0.1 });
      M.air(ctx, x - 14, y + 6, 13, 7, {});
    },

    inkstone: function (ctx) {
      // 砚：一方前宽后窄的石板，后头凹一汪墨。一圈椭圆加一坨黑就是盘子盛蛋
      var x = rnd(42, 58), y = rnd(56, 70), w = rnd(32, 42), d = w * 0.52;
      var top = y - d * 0.5, bot = y + d * 0.5;
      var face = [{ x: x - w * 0.4, y: top }, { x: x + w * 0.4, y: top + rnd(-1, 1) },
        { x: x + w * 0.5, y: bot }, { x: x - w * 0.5, y: bot + rnd(-1, 1) }];
      var fs = M.smooth(face, 4);
      ctx.beginPath();
      ctx.moveTo(fs[0].x, fs[0].y);
      for (var i = 1; i < fs.length; i++) ctx.lineTo(fs[i].x, fs[i].y);
      ctx.closePath();
      var sg = ctx.createLinearGradient(x - w * 0.4, top, x + w * 0.4, bot);
      sg.addColorStop(0, M.colA('#948b7c', 0.5));
      sg.addColorStop(0.5, M.colA('#686156', 0.52));
      sg.addColorStop(1, M.colA('#3d3831', 0.5));
      ctx.fillStyle = sg; ctx.fill();
      // 厚度：底下再走一条平行边，中间填暗
      M.stroke(ctx, [{ x: x - w * 0.5, y: bot + 3 }, { x: x, y: bot + rnd(3.5, 5) }, { x: x + w * 0.5, y: bot + 3 }],
        { w: 2.4, w2: 1.2, alpha: 0.45, color: '#2b2721', profile: 'flat', seg: 10, cap: false });
      M.wash(ctx, x, bot + 1.5, w * 0.46, 2.4, { color: '#2b2721', alpha: 0.3 });
      ctx.save(); ctx.clip();
      // 边只压前缘与右缘，上缘让石自己亮着
      M.stroke(ctx, fs.slice(Math.round(fs.length * 0.25), Math.round(fs.length * 0.8)),
        { w: 1.6, w2: 0.6, alpha: 0.4, color: '#241f1a', profile: 'flat', seg: 6, dry: 0.45, cap: false });
      // 墨池：后头洼下去的一弯，湿黑里留一点水光
      var py = top + d * 0.28;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.3, py);
      ctx.quadraticCurveTo(x, py - d * 0.16, x + w * 0.3, py);
      ctx.quadraticCurveTo(x, py + d * 0.34, x - w * 0.3, py);
      ctx.closePath();
      ctx.fillStyle = M.colA('#161410', 0.62); ctx.fill();
      ctx.fillStyle = M.colA('#8fa3ad', 0.2);
      ctx.beginPath(); ctx.ellipse(x - w * 0.08, py + d * 0.04, w * 0.12, d * 0.06, -0.1, 0, 6.2832); ctx.fill();
      // 砚堂：前头磨出的一片浅亮，带两三道圈痕
      M.wash(ctx, x, bot - d * 0.24, w * 0.34, d * 0.24, { color: '#cfc6b4', alpha: 0.22 });
      for (var g2 = 0; g2 < 3; g2++) {
        M.stroke(ctx, [{ x: x - w * (0.2 - g2 * 0.05), y: bot - d * (0.3 - g2 * 0.08) },
          { x: x + w * (0.2 - g2 * 0.05), y: bot - d * (0.26 - g2 * 0.08) }],
          { w: 0.9, w2: 0.3, alpha: 0.16, color: '#e6ddc8', profile: 'flat', seg: 6, cap: false });
      }
      ctx.restore();
      // 墨锭横躺在砚左边的地上：一块扁方，端面亮、侧面压暗，顶上一道描金
      var ix = x - w * 0.78, iy = bot + rnd(1, 4), iw = w * 0.42, ih = d * 0.2;
      ctx.save();
      ctx.translate(ix, iy); ctx.rotate(rnd(-0.16, 0.1));
      ctx.fillStyle = M.colA('#26231d', 0.66);
      ctx.beginPath();
      ctx.moveTo(-iw / 2, -ih); ctx.lineTo(iw / 2, -ih * rnd(0.8, 1.1));
      ctx.lineTo(iw / 2, ih); ctx.lineTo(-iw / 2, ih * rnd(0.9, 1.15));
      ctx.closePath(); ctx.fill();
      M.stroke(ctx, [{ x: -iw / 2, y: -ih }, { x: 0, y: -ih * rnd(1.1, 1.35) }, { x: iw / 2, y: -ih }],
        { w: 1.1, w2: 0.5, alpha: 0.5, color: '#4a4438', profile: 'flat', seg: 6, cap: false });
      M.stroke(ctx, [{ x: -iw / 2, y: ih }, { x: iw / 2, y: ih * rnd(0.9, 1.1) }],
        { w: 1.2, w2: 0.5, alpha: 0.44, color: '#1a1712', profile: 'flat', seg: 6, cap: false });
      M.stroke(ctx, [{ x: -iw * 0.16, y: -ih * 1.1 }, { x: -iw * 0.16, y: ih }],
        { w: 0.9, w2: 0.4, alpha: 0.4, color: '#b8956a', profile: 'flat', seg: 4, cap: false });
      M.wash(ctx, -iw * 0.34, 0, iw * 0.2, ih * 1.4, { color: '#8f8574', alpha: 0.22 });
      ctx.restore();
      M.wash(ctx, ix, iy + ih * 1.3, iw * 0.5, ih * 0.7, { color: INK, alpha: 0.18 });
      // 一滴水刚落进池里
      M.stroke(ctx, [{ x: x + w * 0.04, y: py - d * 0.5 }, { x: x + w * 0.04, y: py - d * 0.12 }],
        { w: 1.1, w2: 0.35, alpha: 0.4, color: BLUE, profile: 'taper', seg: 4, cap: false });
      ctx.save();
      ctx.strokeStyle = M.hexA(BLUE, 0.24); ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.ellipse(x + w * 0.04, py + d * 0.02, w * 0.07, d * 0.03, 0, 0, 6.2832); ctx.stroke();
      ctx.restore();
      M.splatter(ctx, x - w * 0.1, bot - d * 0.1, w * 0.5, 7, { alpha: 0.26, max: 1 });
      M.wash(ctx, x, bot + d * 0.42, w * 0.5, d * 0.12, { color: INK, alpha: 0.16 });
      M.air(ctx, x - w * 0.62, top - d * 0.5, 13, 7, {});
    },
    tea: function (ctx) {
      // 茶：一盏无柄的小碗，口只画前弧，壁斜斜收到底足。画成半圆带把就是洋杯子
      var x = rnd(42, 58), y = rnd(54, 66), r = rnd(11, 15);
      var wall = '#453f37';
      // 碗身：口宽底窄的一只梯形，两侧各带一点外鼓
      var lp = [{ x: x - r * 0.96, y: y + r * 0.04 }, { x: x - r * 0.78, y: y + r * 0.5 }, { x: x - r * 0.46, y: y + r * 0.9 }];
      var rp = [{ x: x + r * 0.96, y: y + r * 0.04 }, { x: x + r * 0.78, y: y + r * 0.5 }, { x: x + r * 0.46, y: y + r * 0.9 }];
      ctx.beginPath();
      ctx.moveTo(lp[0].x, lp[0].y);
      var ls = M.smooth(lp, 4), rs = M.smooth(rp, 4);
      for (var i = 1; i < ls.length; i++) ctx.lineTo(ls[i].x, ls[i].y);
      ctx.lineTo(rs[rs.length - 1].x, rs[rs.length - 1].y);
      for (i = rs.length - 2; i >= 0; i--) ctx.lineTo(rs[i].x, rs[i].y);
      ctx.closePath();
      var wg = ctx.createLinearGradient(x - r, y, x + r, y + r);
      wg.addColorStop(0, M.colA('#f4ecd9', 0.62));
      wg.addColorStop(0.6, M.colA('#d9ceb4', 0.5));
      wg.addColorStop(1, M.colA('#8f8878', 0.4));
      ctx.fillStyle = wg; ctx.fill();
      M.stroke(ctx, lp, { w: 1.5, w2: 0.8, alpha: 0.6, color: wall, profile: 'flat', seg: 6, cap: false });
      M.stroke(ctx, rp, { w: 1.3, w2: 0.7, alpha: 0.46, color: wall, profile: 'flat', seg: 6, cap: false });
      // 口沿：前弧压住茶汤，后弧只留一点
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.26, 0, 0, 6.2832); ctx.closePath();
      ctx.fillStyle = M.colA('#a87f47', 0.4); ctx.fill();
      ctx.fillStyle = M.colA('#c79a5c', 0.3);
      ctx.beginPath(); ctx.ellipse(x - r * 0.2, y - r * 0.04, r * 0.5, r * 0.13, 0, 0, 6.2832); ctx.fill();
      M.stroke(ctx, [{ x: x - r, y: y }, { x: x, y: y + r * 0.28 }, { x: x + r, y: y }],
        { w: 1.4, w2: 0.7, alpha: 0.62, color: wall, profile: 'flat', seg: 6, cap: false });
      M.stroke(ctx, [{ x: x - r * 0.94, y: y - r * 0.02 }, { x: x, y: y - r * 0.24 }, { x: x + r * 0.94, y: y - r * 0.02 }],
        { w: 0.9, w2: 0.4, alpha: 0.26, color: wall, profile: 'flat', seg: 6, cap: false });
      // 底足一小圈
      M.stroke(ctx, [{ x: x - r * 0.46, y: y + r * 0.9 }, { x: x, y: y + r * 1.02 }, { x: x + r * 0.46, y: y + r * 0.9 }],
        { w: 1.2, w2: 0.6, alpha: 0.5, color: wall, profile: 'flat', seg: 5, cap: false });
      // 茶托：只兜前面一段弧
      M.stroke(ctx, [{ x: x - r * 1.5, y: y + r * 1.12 }, { x: x, y: y + r * 1.42 }, { x: x + r * 1.5, y: y + r * 1.12 }],
        { w: 1.3, w2: 0.7, alpha: 0.4, color: wall, profile: 'flat', seg: 8, cap: false });
      M.stroke(ctx, [{ x: x - r * 1.44, y: y + r * 1.06 }, { x: x, y: y + r * 0.9 }, { x: x + r * 1.44, y: y + r * 1.06 }],
        { w: 0.8, w2: 0.4, alpha: 0.2, color: wall, profile: 'flat', seg: 8, cap: false });
      // 汽：三笔长短不同，越上越散
      for (var s = 0; s < 3; s++) {
        var sx = x - r * 0.5 + s * r * 0.5, hh = rnd(2.2, 3.4);
        M.stroke(ctx, [{ x: sx, y: y - r * 0.3 }, { x: sx + rnd(-3, 5), y: y - r * hh * 0.6 }, { x: sx + rnd(-5, 8), y: y - r * hh }],
          { w: 1.2, w2: 0.12, alpha: 0.24 - s * 0.04, profile: 'taper', seg: 9, dry: 0.45, cap: false });
      }
      // 叶两片浮在面上
      for (var lf = 0; lf < rint(1, 3); lf++) {
        taperLeaf(ctx, x + rnd(-r * 0.6, r * 0.6), y + rnd(-r * 0.1, r * 0.1), rnd(0, 6.28), rnd(1.6, 2.6), 0.7,
          { color: '#5d6a45', alpha: rnd(0.3, 0.5), bend: 0.2 });
      }
      M.wash(ctx, x, y + r * 1.5, r * 1.4, r * 0.14, { color: INK, alpha: 0.14 });
      M.air(ctx, x + r * 2, y - r * 1.6, 12, 6, {});
    },
    zither: function (ctx) {
      // 琴：首宽尾窄的一张长漆板，七弦从头走到尾。画成方块加斜线就是尺
      var x = rnd(24, 40), y = rnd(54, 66), L = rnd(42, 56), bw = L * 0.13, tilt = rnd(-0.26, -0.08);
      ctx.save();
      ctx.translate(x, y); ctx.rotate(tilt);
      var tp = [], bt = [], i, t;
      for (i = 0; i <= 12; i++) {
        t = i / 12;
        var hw = bw * (1.05 - 0.35 * t - 0.1 * Math.sin(t * 6.28));
        tp.push({ x: t * L, y: -hw });
        bt.push({ x: t * L, y: hw * 0.9 });
      }
      var body = tp.concat(bt.slice().reverse());
      var bs = M.smooth(body, 3);
      ctx.beginPath();
      ctx.moveTo(bs[0].x, bs[0].y);
      for (i = 1; i < bs.length; i++) ctx.lineTo(bs[i].x, bs[i].y);
      ctx.closePath();
      var lg = ctx.createLinearGradient(0, -bw, 0, bw);
      lg.addColorStop(0, M.colA('#5c5347', 0.62));
      lg.addColorStop(0.5, M.colA('#3a352d', 0.6));
      lg.addColorStop(1, M.colA('#221f1a', 0.5));
      ctx.fillStyle = lg; ctx.fill();
      // 轮廓走一笔，尾重头轻
      M.stroke(ctx, tp, { w: 1.5, w2: 0.8, alpha: 0.55, color: '#1f1c18', profile: 'flat', seg: 8, dry: 0.3, cap: false });
      M.stroke(ctx, bt, { w: 1.8, w2: 0.9, alpha: 0.6, color: '#1f1c18', profile: 'flat', seg: 8, dry: 0.3, cap: false });
      // 岳山一道横杠，弦从它上面过
      M.stroke(ctx, [{ x: L * 0.06, y: -bw * 1.1 }, { x: L * 0.06, y: bw * 1.0 }], { w: 2.2, w2: 1.6, alpha: 0.6, color: '#c9a86a', profile: 'flat', seg: 4, cap: false });
      // 七弦：间距不等，走到龙龈收住
      for (i = 0; i < 7; i++) {
        var f = (i + 0.5) / 7, ya = -bw * 0.86 + f * bw * 1.72, yb = -bw * 0.6 + f * bw * 1.24;
        M.stroke(ctx, [{ x: L * 0.06, y: ya }, { x: L * 0.5, y: (ya + yb) / 2 + rnd(-0.4, 0.4) }, { x: L * 0.97, y: yb }],
          { w: 0.5, w2: 0.3, alpha: 0.4 + i * 0.02, color: '#efe6d0', profile: 'flat', seg: 10, cap: false });
      }
      // 徽：外侧几点淡金
      for (i = 0; i < 4; i++) {
        M.dot(ctx, L * (0.2 + i * 0.19), -bw * 0.72, 0.7, { color: '#d8bd85', alpha: 0.6 });
      }
      ctx.restore();
      // 一声：两段很淡的弧从面上散出去
      for (var r2 = 0; r2 < 2; r2++) {
        ctx.save();
        ctx.strokeStyle = M.hexA(INK, 0.14 - r2 * 0.05);
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.arc(x + L * 0.5, y - bw * 2, L * (0.16 + r2 * 0.1), -2.5, -0.7); ctx.stroke();
        ctx.restore();
      }
      // 案：琴下两足压出的一点影
      M.wash(ctx, x + L * 0.5, y + bw * 1.9, L * 0.42, 2.6, { color: INK, alpha: 0.16 });
      M.air(ctx, x + L * 0.9, y - L * 0.24, 14, 7, {});
    },

    drum: function (ctx) {
      // 鼓：腔是两头细中间粗的一只桶，面上一圈钉。直边加圆点就是碗
      var x = rnd(42, 58), y = rnd(44, 56), r = rnd(13, 18), hh = r * rnd(1.15, 1.45);
      // 腔身：两侧各一笔向外鼓
      var left = [{ x: x - r * 0.78, y: y }, { x: x - r * 1.06, y: y + hh * 0.5 }, { x: x - r * 0.78, y: y + hh }];
      var right = [{ x: x + r * 0.78, y: y }, { x: x + r * 1.06, y: y + hh * 0.5 }, { x: x + r * 0.78, y: y + hh }];
      ctx.beginPath();
      ctx.moveTo(left[0].x, left[0].y);
      var ls = M.smooth(left, 4), rs = M.smooth(right, 4);
      for (var i = 1; i < ls.length; i++) ctx.lineTo(ls[i].x, ls[i].y);
      for (i = rs.length - 1; i >= 0; i--) ctx.lineTo(rs[i].x, rs[i].y);
      ctx.closePath();
      var bg = ctx.createLinearGradient(x - r, y, x + r, y + hh);
      bg.addColorStop(0, M.colA('#b0442f', 0.3));
      bg.addColorStop(0.5, M.colA('#7d3324', 0.36));
      bg.addColorStop(1, M.colA('#43241c', 0.34));
      ctx.fillStyle = bg; ctx.fill();
      M.stroke(ctx, left, { w: 1.8, w2: 0.9, alpha: 0.55, color: '#3a241d', profile: 'flat', seg: 7, dry: 0.3, cap: false });
      M.stroke(ctx, right, { w: 1.6, w2: 0.8, alpha: 0.45, color: '#3a241d', profile: 'flat', seg: 7, dry: 0.35, cap: false });
      // 腔上一道箍
      M.stroke(ctx, [{ x: x - r * 1.02, y: y + hh * 0.5 }, { x: x + r * 1.02, y: y + hh * 0.5 }],
        { w: 1.2, w2: 0.5, alpha: 0.3, color: '#d8bd85', profile: 'flat', seg: 8, cap: false });
      // 面：一张淡黄皮，前缘实、后缘虚
      ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 0.34, 0, 0, 6.2832); ctx.closePath();
      ctx.fillStyle = M.colA('#e7d7ae', 0.55); ctx.fill();
      M.stroke(ctx, [{ x: x - r * 0.8, y: y }, { x: x, y: y + r * 0.36 }, { x: x + r * 0.8, y: y }],
        { w: 1.5, w2: 0.7, alpha: 0.55, color: '#3a241d', profile: 'flat', seg: 7, cap: false });
      M.stroke(ctx, [{ x: x - r * 0.76, y: y - r * 0.06 }, { x: x, y: y - r * 0.32 }, { x: x + r * 0.76, y: y - r * 0.06 }],
        { w: 0.9, w2: 0.4, alpha: 0.26, color: '#3a241d', profile: 'flat', seg: 7, cap: false });
      // 钉：沿面一周，间距不等
      for (var k = 0; k < rint(9, 12); k++) {
        var aa = k / 12 * 6.2832 + rnd(-0.08, 0.08);
        M.dot(ctx, x + Math.cos(aa) * r * 0.74, y + Math.sin(aa) * r * 0.3, rnd(0.5, 0.9), { color: '#c9a86a', alpha: rnd(0.4, 0.65) });
      }
      // 底面一小段弧
      M.stroke(ctx, [{ x: x - r * 0.7, y: y + hh }, { x: x, y: y + hh + r * 0.28 }, { x: x + r * 0.7, y: y + hh }],
        { w: 1.3, w2: 0.6, alpha: 0.4, color: '#3a241d', profile: 'flat', seg: 7, cap: false });
      // 两签交叉，头上一粒
      for (var d = 0; d < 2; d++) {
        var da = d ? rnd(-1.3, -1.0) : rnd(-0.75, -0.45);
        var dx = x + rnd(-2, 6), dy = y - r * 0.4;
        M.stroke(ctx, [{ x: dx, y: dy }, { x: dx + Math.cos(da) * r * 1.5, y: dy + Math.sin(da) * r * 1.5 }],
          { w: 1.6, w2: 0.9, alpha: 0.6, color: '#5d5344', profile: 'flat', seg: 6, cap: false });
        M.dot(ctx, dx + Math.cos(da) * r * 1.5, dy + Math.sin(da) * r * 1.5, 1.6, { color: '#7d3324', alpha: 0.6 });
      }
      // 一声
      for (var v = 0; v < 2; v++) {
        ctx.save();
        ctx.strokeStyle = M.hexA(INK, 0.13 - v * 0.04); ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.arc(x, y, r * (1.2 + v * 0.4), -2.4, -0.8); ctx.stroke();
        ctx.restore();
      }
      M.wash(ctx, x, y + hh + r * 0.4, r * 1.2, r * 0.14, { color: INK, alpha: 0.16 });
      M.air(ctx, x + r * 1.8, y - r * 1.2, 13, 7, {});
    },

    bell: function (ctx) {
      // 钟：肩上收、口上撇的一块湿灰，纹带和乳丁撑出铜味。描一圈就是吊牌
      var x = rnd(44, 58), y = rnd(40, 54), w = rnd(16, 24), h = w * rnd(1.3, 1.6);
      var tl = [{ x: x - w * 0.22, y: y - h * 0.46 }, { x: x - w * 0.46, y: y - h * 0.1 }, { x: x - w * 0.5, y: y + h * 0.36 }, { x: x - w * 0.6, y: y + h * 0.5 }];
      var tr = [{ x: x + w * 0.22, y: y - h * 0.46 }, { x: x + w * 0.46, y: y - h * 0.1 }, { x: x + w * 0.5, y: y + h * 0.36 }, { x: x + w * 0.6, y: y + h * 0.5 }];
      ctx.beginPath();
      ctx.moveTo(tl[0].x, tl[0].y);
      var a1 = M.smooth(tl, 4), a2 = M.smooth(tr, 4);
      for (var i = 1; i < a1.length; i++) ctx.lineTo(a1[i].x, a1[i].y);
      ctx.lineTo(x + w * 0.34, y + h * 0.58);
      ctx.quadraticCurveTo(x, y + h * 0.66, x - w * 0.34, y + h * 0.58);
      for (i = a2.length - 1; i >= 0; i--) ctx.lineTo(a2[i].x, a2[i].y);
      ctx.closePath();
      var bg = ctx.createLinearGradient(x - w * 0.5, y, x + w * 0.5, y + h * 0.4);
      bg.addColorStop(0, M.colA('#8a7f66', 0.5));
      bg.addColorStop(0.45, M.colA('#5d5648', 0.55));
      bg.addColorStop(1, M.colA('#332f28', 0.5));
      ctx.fillStyle = bg; ctx.fill();
      M.stroke(ctx, tl, { w: 1.6, w2: 0.8, alpha: 0.5, color: '#2b2721', profile: 'flat', seg: 7, dry: 0.3, cap: false });
      M.stroke(ctx, tr, { w: 1.4, w2: 0.7, alpha: 0.4, color: '#2b2721', profile: 'flat', seg: 7, dry: 0.35, cap: false });
      // 钟口一撇，中间坠一点
      M.stroke(ctx, [{ x: x - w * 0.6, y: y + h * 0.5 }, { x: x, y: y + h * 0.64 }, { x: x + w * 0.6, y: y + h * 0.5 }],
        { w: 2, w2: 1, alpha: 0.6, color: '#2b2721', profile: 'flat', seg: 7, cap: false });
      // 纹带两道 + 乳丁三组
      for (var b2 = 0; b2 < 2; b2++) {
        var by = y - h * (0.24 - b2 * 0.3);
        M.stroke(ctx, [{ x: x - w * 0.44, y: by }, { x: x, y: by + h * 0.04 }, { x: x + w * 0.44, y: by }],
          { w: 0.8, w2: 0.4, alpha: 0.32, color: '#c9a86a', profile: 'flat', seg: 7, cap: false });
      }
      for (var g3 = 0; g3 < 3; g3++) {
        var gx = x + (g3 - 1) * w * 0.32;
        for (var g4 = 0; g4 < 3; g4++) M.dot(ctx, gx + g4 * w * 0.05, y - h * 0.08 + g4 * h * 0.06, w * 0.035, { color: '#6f6553', alpha: 0.5 });
      }
      // 蒲牢：顶上一枚粗环，不画整圆
      M.stroke(ctx, [{ x: x - w * 0.14, y: y - h * 0.46 }, { x: x, y: y - h * 0.62 }, { x: x + w * 0.14, y: y - h * 0.46 }],
        { w: 2.4, w2: 1.6, alpha: 0.6, color: '#2b2721', profile: 'flat', seg: 5, cap: false });
      M.dot(ctx, x, y - h * 0.5, w * 0.06, { color: '#e9e0cb', alpha: 0.5 });
      // 钟锤
      M.dot(ctx, x, y + h * 0.7, w * 0.1, { color: '#2b2721', alpha: 0.7 });
      // 声：两圈很细的弧，压在钟上就成了花纹
      for (var v = 0; v < 2; v++) {
        ctx.save();
        ctx.strokeStyle = M.hexA(INK, 0.14 - v * 0.04); ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.arc(x, y, w * (0.9 + v * 0.42), -2.5, -0.65); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, w * (0.9 + v * 0.42), 0.65, 2.5); ctx.stroke();
        ctx.restore();
      }
      M.wash(ctx, x, y + h * 0.82, w * 0.7, h * 0.07, { color: INK, alpha: 0.14 });
      M.air(ctx, x + w * 1.4, y - h * 0.5, 13, 7, {});
    },
    cart: function (ctx) {
      var x = rnd(24, 44), y = rnd(58, 72), w = rnd(24, 34);
      var wr = w * rnd(0.24, 0.3), by = y - wr * 0.42, bh = w * 0.34;
      var dk = M.darken(INK, 0.72);
      // 车厢：一整块侧板，上浓下淡，不是四根线围的空框
      ctx.save();
      var g = ctx.createLinearGradient(0, by - bh, 0, by);
      g.addColorStop(0, M.colA(dk, 0.5));
      g.addColorStop(0.6, M.colA(INK, 0.3));
      g.addColorStop(1, M.colA(INK, 0.16));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, by - bh); ctx.lineTo(x + w * 0.86, by - bh * 0.92);
      ctx.lineTo(x + w * 0.86, by); ctx.lineTo(x, by);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      M.stroke(ctx, [{ x: x, y: by - bh }, { x: x + w * 0.86, y: by - bh * 0.92 }],
        { w: w * 0.04, w2: w * 0.03, alpha: 0.7, color: dk, profile: 'flat', seg: 6, cap: false });
      M.stroke(ctx, [{ x: x, y: by }, { x: x + w * 0.86, y: by }],
        { w: w * 0.055, w2: w * 0.04, alpha: 0.78, color: dk, profile: 'flat', seg: 6, cap: false });
      // 篷：前半顶上一片弧，下面留一块阴
      if (chance(0.7)) {
        var cv = [];
        for (var i = 0; i <= 8; i++) {
          var t = i / 8;
          cv.push({ x: x + w * 0.04 + t * w * 0.5, y: by - bh - Math.sin(t * Math.PI) * w * 0.28 });
        }
        M.stroke(ctx, cv, { w: w * 0.075, w2: w * 0.05, alpha: 0.66, color: dk, profile: 'flat', seg: 8, dry: 0.26, cap: false });
        for (var rb = 1; rb < 4; rb++) {
          var rp = cv[Math.round(rb / 4 * (cv.length - 1))];
          M.stroke(ctx, [{ x: rp.x, y: rp.y }, { x: rp.x, y: by - bh * 0.2 }],
            { w: w * 0.02, alpha: 0.4, profile: 'flat', seg: 5, cap: false });
        }
        M.wash(ctx, x + w * 0.28, by - bh * 0.46, w * 0.22, bh * 0.5, { color: INK, alpha: 0.2 });
      }
      // 两轮：近轮大、远轮小而且淡
      wheel(ctx, x + w * 0.62, y + wr * 0.16, wr, {});
      wheel(ctx, x + w * 0.18, y - wr * 0.1, wr * 0.84, { alpha: 0.42 });
      // 车辕：往前平伸两道，末端微翘
      [[-0.02], [0.1]].forEach(function (sd) {
        M.stroke(ctx, [{ x: x + w * 0.84, y: by - bh * 0.3 + sd[0] * bh },
          { x: x + w * 1.3, y: by - bh * 0.42 + sd[0] * bh },
          { x: x + w * 1.62, y: by - bh * 0.62 + sd[0] * bh }],
          { w: w * 0.035, w2: w * 0.02, alpha: 0.72, color: dk, profile: 'flat', seg: 7, cap: false });
      });
      // 辕前一头牲口，或一个赶车的
      if (chance(0.55)) {
        beast(ctx, x + w * 1.92, y - wr * 0.3, wr * 0.92, {
          dir: 1, alpha: 0.6, depth: 0.42, neck: { ang: -0.7, len: 0.34, w: 0.42 }, neckCurl: 0.1,
          head: 'muzzle', headLen: 0.4, muzzleDip: 0.22, headAlpha: 0.5, legLen: 0.8, legW: 0.16, tail: 0.7
        });
      } else {
        var fx = x + w * 0.96;
        M.blot(ctx, fx, by - bh * 1.1, w * 0.07, { alpha: 0.8 });
        M.dot(ctx, fx, by - bh * 1.5, w * 0.035, { alpha: 0.85 });
      }
      // 辙痕：两道平行浅墨，往画外去
      for (var z = 0; z < 2; z++) {
        M.stroke(ctx, [{ x: x - w * 0.9, y: y + wr * 0.3 + z * wr * 0.16 },
          { x: x + w * 0.1, y: y + wr * 0.26 + z * wr * 0.16 }],
          { w: w * 0.02, w2: w * 0.006, alpha: 0.26 - z * 0.04, profile: 'flat', seg: 9, cap: false });
      }
      M.wash(ctx, x + w * 0.44, y + wr * 0.42, w * 0.7, wr * 0.14, { color: INK, alpha: 0.18 });
      M.air(ctx, x + w * 0.4, by - bh * 0.4, w * 0.7, bh, {});
    },

    road: function (ctx) {
      // 一条路：S 形的一道白，两道边线近粗远细，尽头化进雾里。直直收到一点就成了三角旗
      var x0 = rnd(34, 66), y0 = rnd(94, 99);
      var y1 = rnd(26, 42), bend = rnd(-14, 14), bend2 = rnd(-26, 26);
      var sp = M.smooth([{ x: x0, y: y0 }, { x: x0 + bend2 * 0.4, y: y0 - (y0 - y1) * 0.3 },
        { x: x0 + bend, y: y0 - (y0 - y1) * 0.66 }, { x: x0 + bend * 0.4, y: y1 }], 9);
      var w0 = rnd(15, 21), wEnd = rnd(1.8, 2.8);
      var L = [], R = [];
      for (var i = 0; i < sp.length; i++) {
        var t = i / (sp.length - 1);
        var hw = w0 * (1 - t) + wEnd * t;
        var pv = sp[Math.max(0, i - 1)], nx = sp[Math.min(sp.length - 1, i + 1)];
        var a = Math.atan2(nx.y - pv.y, nx.x - pv.x) + Math.PI / 2;
        var wob = 1 + Math.sin(t * 7.7) * 0.05;
        L.push({ x: sp[i].x + Math.cos(a) * hw * wob, y: sp[i].y + Math.sin(a) * hw * 0.42 });
        R.push({ x: sp[i].x - Math.cos(a) * hw * wob, y: sp[i].y - Math.sin(a) * hw * 0.42 });
      }
      // 路面是一条比纸还亮的白，两侧的地压暗
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(L[0].x, L[0].y);
      for (var j = 1; j < L.length; j++) ctx.lineTo(L[j].x, L[j].y);
      for (var k = R.length - 1; k >= 0; k--) ctx.lineTo(R[k].x, R[k].y);
      ctx.closePath();
      var g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(253,247,234,0.55)');
      g.addColorStop(0.7, 'rgba(253,247,234,0.36)');
      g.addColorStop(1, 'rgba(253,247,234,0.12)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      // 边线：断断续续的两道，近处粗、往远淡成一丝
      [L, R].forEach(function (side, si) {
        for (var s = 0; s < side.length - 2; s += rint(3, 6)) {
          var e = Math.min(side.length - 1, s + rint(3, 7));
          var tt = s / (side.length - 1);
          M.stroke(ctx, [side[s], { x: (side[s].x + side[e].x) / 2 + rnd(-0.7, 0.7), y: (side[s].y + side[e].y) / 2 }, side[e]],
            { w: 2.2 * (1 - tt) + 0.3, w2: 0.3, alpha: (0.4 - tt * 0.24) * (si ? 0.82 : 1),
              color: M.darken(INK, 0.78), profile: 'taper', seg: 6, cap: false });
        }
      });
      // 石板：只在近段露几道
      for (var q = 2; q < sp.length * 0.5; q += rint(3, 6)) {
        var qt = q / (sp.length - 1);
        var hw2 = w0 * (1 - qt) + wEnd * qt;
        ctx.save();
        ctx.globalAlpha = 0.2 * (1 - qt);
        ctx.strokeStyle = INK;
        ctx.lineWidth = Math.max(0.25, 1.2 * (1 - qt));
        ctx.beginPath();
        ctx.moveTo(sp[q].x - hw2 * 0.88, sp[q].y + hw2 * 0.3);
        ctx.lineTo(sp[q].x + hw2 * 0.88, sp[q].y - hw2 * 0.3);
        ctx.stroke();
        ctx.restore();
      }
      // 路旁：夹着这条白的草与石，越近越疏朗
      for (var z = 0; z < rint(8, 12); z++) {
        var zt = Math.pow(rnd(0, 1), 0.7) * 0.84;
        var zi = clamp(Math.round(zt * (sp.length - 1)), 0, sp.length - 1);
        var sgn = chance(0.5) ? 1 : -1;
        var hwz = w0 * (1 - zt) + wEnd * zt;
        var px = sp[zi].x + sgn * (hwz + rnd(1.5, 6));
        var py = sp[zi].y + sgn * 2;
        if (chance(0.24)) {
          M.blot(ctx, px, py, rnd(0.8, 1.9) * (1 - zt * 0.6), { alpha: 0.42 });
        } else {
          for (var l = 0; l < rint(2, 4); l++) {
            taperLeaf(ctx, px + rnd(-0.8, 0.8), py, -Math.PI / 2 + rnd(-0.7, 0.7),
              rnd(1.8, 4.4) * (1 - zt), rnd(0.4, 0.8), { color: INK, alpha: rnd(0.2, 0.4), bend: rnd(-0.26, 0.26) });
          }
        }
      }
      // 远处：一抹山、一片雾，路走进那里
      M.ridge(ctx, x0 - 44, x0 + 44, y1 + 10, rnd(11, 19), 8, { alpha: 0.13, lw: 0.5, fade: true, seed: rnd(0, 6) });
      M.wash(ctx, x0 + bend * 0.4, y1 - 1, w0 * 1.5, 6, { color: '#f8f2e2', alpha: 0.6 });
      M.air(ctx, x0 + bend * 0.5, y1 + 6, 24, 9, {});
    },

    /* ———— 人身与抽象 ———— */
    person: function (ctx) {
      var dir = chance(0.5) ? 1 : -1;
      var s = rnd(40, 52), x = clamp(50 + rnd(-14, 14), 12 + s * 0.5, 88 - s * 0.5), y = rnd(80, 88);
      figure(ctx, x, y, s, { dir: dir, robe: chance(0.3) ? '#4e5a63' : '#585247' });
      // 手里得有个东西：拄杖或挑个囊，空两条胳膊就是木偶
      if (chance(0.6)) {
        var gx = x + dir * s * 0.32;
        M.stroke(ctx, [{ x: gx + dir * 1.5, y: y - s * 0.74 }, { x: gx, y: y - s * 0.34 }, { x: gx - dir, y: y - s * 0.04 }],
          { w: 1.4, w2: 0.8, alpha: 0.6, color: '#6b6154', profile: 'flat', seg: 7, dry: 0.3, cap: false });
        if (chance(0.5)) {
          var tp = { x: gx + dir * 1.7, y: y - s * 0.78 };
          M.dot(ctx, tp.x, tp.y, s * 0.05, { color: '#8a7a5e', alpha: 0.62 });
        }
      }
      if (chance(0.7)) M.ridge(ctx, x - s * 2.4, x + s * 2.4, y - s * 0.6, rnd(8, 15), 7, { alpha: 0.12, lw: 0.5, fade: true, seed: rnd(0, 6) });
      M.stroke(ctx, [{ x: x - s * 0.8, y: y + 1.2 }, { x: x + s * 0.8, y: y + 1.6 }],
        { w: 1.2, w2: 0.2, alpha: 0.28, profile: 'flat', seg: 12 });
      M.wash(ctx, x, y + 2.5, s * 0.8, s * 0.1, { color: INK, alpha: 0.15 });
      if (chance(0.35)) M.seal(ctx, x - dir * s * 1.15, y - s * 1.02, s * 0.2, s * 0.22, '人', { size: s * 0.14 });
    },

    heart: function (ctx) {
      // 心：湿笔晕成的丹心。齐边又匀色的红块是印刷品——底要薄、斑要沉、墨只敢压一角
      var x = rnd(44, 56), y = rnd(44, 54), w = rnd(18, 23), h = w * rnd(1.0, 1.12);
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rnd(-0.2, 0.16));
      function cv(p0, p1, p2, p3, n) {
        var out = [];
        for (var i = 0; i <= n; i++) {
          var t = i / n, u = 1 - t;
          out.push({ x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
            y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y });
        }
        return out;
      }
      // 两瓣不等高、尖偏一点，齐整的贝塞尔一眼就是电脑画的
      var tip = { x: w * rnd(-0.08, 0.08), y: h * rnd(0.76, 0.9) };
      var dip = { x: w * rnd(-0.12, 0.06), y: -h * rnd(0.32, 0.46) };
      var path = cv(tip, { x: -w * rnd(1.42, 1.62), y: -h * 0.1 }, { x: -w * 0.78, y: -h * rnd(1.04, 1.2) }, dip, 12)
        .concat(cv(dip, { x: w * 0.8, y: -h * rnd(1.0, 1.18) }, { x: w * rnd(1.34, 1.56), y: -h * 0.08 }, tip, 12));
      for (var j = 0; j < path.length; j++) { path[j].x += rnd(-w * 0.03, w * 0.03); path[j].y += rnd(-h * 0.03, h * 0.03); }
      var hp = M.smooth(path, 3);
      function poly(pts) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
      }
      M.wash(ctx, 0, 0, w * 2.6, h * 2.2, { color: RED, alpha: 0.1 });
      ctx.save(); poly(hp); ctx.clip();
      ctx.fillStyle = M.colA(RED, 0.15); ctx.fillRect(-w * 2.2, -h * 2.2, w * 4.4, h * 4.4);
      // 两汪颜色相撞的地方会沉下去，这就是湿笔
      for (var k = 0; k < 11; k++) {
        var deep = k % 3 === 0;
        ctx.fillStyle = M.colA(deep ? '#8a2f26' : (k % 2 ? '#bd4c3c' : '#e08a70'), rnd(0.07, deep ? 0.2 : 0.15));
        ctx.beginPath();
        ctx.ellipse(rnd(-w * 0.9, w * 0.9), rnd(-h * 0.72, h * 0.72), w * rnd(0.2, 0.58), h * rnd(0.14, 0.38), rnd(0, 3.14), 0, 6.2832);
        ctx.fill();
      }
      ctx.fillStyle = M.colA('#5e1f1b', 0.18);
      ctx.beginPath(); ctx.ellipse(w * 0.16, h * 0.48, w * 0.78, h * 0.32, -0.3, 0, 6.2832); ctx.fill();
      // 干笔皴两下，破掉平涂
      M.stroke(ctx, [{ x: -w * 0.66, y: -h * 0.14 }, { x: -w * 0.1, y: h * 0.3 }, { x: w * 0.52, y: -h * 0.06 }],
        { w: w * 0.17, w2: w * 0.02, alpha: 0.15, color: '#a04030', profile: 'flat', seg: 9, dry: 0.72, cap: false });
      ctx.restore();
      // 边缘故意洇出界，齐边就是贴纸
      for (var e = 0; e < 9; e++) {
        var pp = path[rint(1, path.length - 2)];
        M.wash(ctx, pp.x * rnd(1.0, 1.16), pp.y * rnd(1.0, 1.16), w * rnd(0.2, 0.5), h * rnd(0.12, 0.3), { color: RED, alpha: rnd(0.05, 0.1) });
      }
      // 墨只压左下一段，右上让颜色自己收住
      M.stroke(ctx, path.slice(1, 10), { w: w * 0.075, w2: w * 0.012, alpha: 0.42, color: '#6d2622', profile: 'brush', seg: 6, dry: 0.55, cap: false });
      M.stroke(ctx, path.slice(15, 21), { w: w * 0.03, w2: 0.01, alpha: 0.15, color: '#6d2622', profile: 'taper', seg: 5, dry: 0.8, cap: false });
      ctx.restore();
      M.wash(ctx, x, y + h * 1.28, w * 1.2, h * 0.15, { color: INK, alpha: 0.09 });
      M.air(ctx, x + w * rnd(0.9, 1.3), y - h * rnd(0.7, 1.1), 13, 8, {});
    },
    hand: function (ctx) {
      // 手：掌是一团湿墨，五指是从掌里长出来的笔。一根根管子并排插上去就成了爪
      var x = rnd(44, 56), y = rnd(50, 58), s = rnd(22, 26);
      var skin = '#4a453e', pale = '#f0e6d2';
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rnd(-0.14, 0.14)); ctx.scale(chance(0.5) ? 1 : -1, 1);
      // 腕与袖：两笔宽扁的压下去，别画成一块灰梯形
      M.stroke(ctx, [{ x: -s * 0.2, y: s * 0.3 }, { x: -s * 0.26, y: s * 0.72 }, { x: -s * 0.3, y: s * 1.1 }],
        { w: s * 0.42, w2: s * 0.5, alpha: 0.3, color: '#6d675b', profile: 'flat', seg: 7, dry: 0.3, cap: false });
      M.stroke(ctx, [{ x: s * 0.22, y: s * 0.3 }, { x: s * 0.3, y: s * 0.74 }, { x: s * 0.34, y: s * 1.1 }],
        { w: s * 0.36, w2: s * 0.46, alpha: 0.24, color: '#57524a', profile: 'flat', seg: 7, dry: 0.34, cap: false });
      M.stroke(ctx, [{ x: -s * 0.44, y: s * 0.34 }, { x: 0, y: s * 0.44 }, { x: s * 0.46, y: s * 0.34 }],
        { w: s * 0.05, w2: s * 0.02, alpha: 0.45, color: skin, profile: 'flat', seg: 6, cap: false });
      // 五指：根在掌里，梢在掌外，长短俯仰都不同
      var fg = [{ bx: -s * 0.3, by: -s * 0.2, an: -1.92, l: s * 0.44, hw: s * 0.088, bn: 0.06 },
        { bx: -s * 0.06, by: -s * 0.24, an: -1.73, l: s * 0.53, hw: s * 0.092, bn: -0.02 },
        { bx: s * 0.16, by: -s * 0.23, an: -1.55, l: s * 0.48, hw: s * 0.086, bn: -0.05 },
        { bx: s * 0.32, by: -s * 0.16, an: -1.35, l: s * 0.4, hw: s * 0.076, bn: -0.08 }];
      var th = [{ x: -s * 0.32, y: s * 0.04 }, { x: -s * 0.52, y: -s * 0.1 }, { x: -s * 0.6, y: -s * 0.28 }];
      function finger(pts, hw) {
        M.ink3(ctx, pts, { w: hw, w2: hw * 0.66, alpha: 0.46, washAlpha: 0.12, color: skin, profile: 'taper', seg: 7, core: false, dry: 0.2 });
      }
      var tips = [];
      for (var i = 0; i < fg.length; i++) {
        var F = fg[i], c = Math.cos(F.an), sn = Math.sin(F.an), nx = -sn, ny = c;
        var mid = { x: F.bx + c * F.l * 0.54 + nx * s * F.bn, y: F.by + sn * F.l * 0.54 + ny * s * F.bn };
        var tip = { x: F.bx + c * F.l + nx * s * F.bn * 1.6, y: F.by + sn * F.l + ny * s * F.bn * 1.6 };
        finger([{ x: F.bx, y: F.by }, mid, tip], F.hw);
        tips.push({ p: tip, hw: F.hw, a: F.an });
      }
      finger(th, s * 0.105);
      // 掌：一块实的压住指根，指头才像是长出来的
      var pm = [{ x: -s * 0.44, y: s * 0.06 }, { x: -s * 0.4, y: -s * 0.14 }, { x: -s * 0.28, y: -s * 0.24 },
        { x: s * 0.0, y: -s * 0.27 }, { x: s * 0.26, y: -s * 0.24 }, { x: s * 0.36, y: -s * 0.1 },
        { x: s * 0.33, y: s * 0.16 }, { x: s * 0.2, y: s * 0.32 }, { x: -s * 0.16, y: s * 0.34 }, { x: -s * 0.36, y: s * 0.2 }];
      var ps = M.smooth(pm, 3);
      ctx.beginPath();
      ctx.moveTo(ps[0].x, ps[0].y);
      for (var q = 1; q < ps.length; q++) ctx.lineTo(ps[q].x, ps[q].y);
      ctx.closePath();
      var pg = ctx.createLinearGradient(-s * 0.4, -s * 0.3, s * 0.3, s * 0.3);
      pg.addColorStop(0, M.colA(pale, 0.58));
      pg.addColorStop(0.5, M.colA('#dccdaa', 0.44));
      pg.addColorStop(1, M.colA('#8a8071', 0.34));
      ctx.fillStyle = pg; ctx.fill();
      ctx.save(); ctx.clip();
      // 只压外缘两笔，全圈描边就是贴纸
      M.stroke(ctx, ps.slice(Math.round(ps.length * 0.4), Math.round(ps.length * 0.86)),
        { w: s * 0.032, w2: s * 0.014, alpha: 0.5, color: skin, profile: 'flat', seg: 5, dry: 0.3, cap: false });
      M.stroke(ctx, [{ x: -s * 0.42, y: -s * 0.1 }, { x: -s * 0.46, y: s * 0.14 }, { x: -s * 0.3, y: s * 0.3 }],
        { w: s * 0.026, w2: s * 0.01, alpha: 0.34, color: skin, profile: 'flat', seg: 6, cap: false });
      // 指根一行节，间距随指宽
      for (var b = 0; b < fg.length; b++) {
        var D = fg[b];
        M.stroke(ctx, [{ x: D.bx - D.hw * 0.6, y: D.by - s * 0.02 }, { x: D.bx + D.hw * 0.6, y: D.by - s * 0.03 }],
          { w: s * 0.016, w2: s * 0.006, alpha: 0.3, color: skin, profile: 'flat', seg: 4, cap: false });
      }
      // 掌纹三条，起讫长短都不同
      M.stroke(ctx, [{ x: -s * 0.42, y: -s * 0.08 }, { x: -s * 0.14, y: s * 0.06 }, { x: s * 0.14, y: s * 0.02 }],
        { w: s * 0.02, w2: 0.006, alpha: 0.3, color: skin, profile: 'taper', seg: 8, cap: false });
      M.stroke(ctx, [{ x: s * 0.34, y: -s * 0.14 }, { x: s * 0.1, y: s * 0.16 }, { x: -s * 0.2, y: s * 0.3 }],
        { w: s * 0.018, w2: 0.005, alpha: 0.26, color: skin, profile: 'taper', seg: 8, cap: false });
      M.stroke(ctx, [{ x: -s * 0.36, y: s * 0.16 }, { x: -s * 0.1, y: s * 0.24 }, { x: s * 0.18, y: s * 0.2 }],
        { w: s * 0.014, w2: 0.005, alpha: 0.2, color: skin, profile: 'taper', seg: 7, cap: false });
      // 拇球一层湿影，掌才厚起来
      M.wash(ctx, -s * 0.3, s * 0.02, s * 0.18, s * 0.24, { color: '#c9b893', alpha: 0.24 });
      ctx.restore();
      // 指甲：梢上一点淡痕，压在轮廓里
      for (var t = 0; t < tips.length; t++) {
        var T = tips[t];
        M.dot(ctx, T.p.x - Math.cos(T.a) * T.hw * 0.3, T.p.y - Math.sin(T.a) * T.hw * 0.3, T.hw * 0.5, { color: pale, alpha: 0.4 });
      }
      M.dot(ctx, th[2].x + s * 0.02, th[2].y + s * 0.02, s * 0.05, { color: pale, alpha: 0.36 });
      ctx.restore();
      M.wash(ctx, x, y + s * 1.02, s * 1.1, s * 0.2, { color: INK, alpha: 0.12 });
      if (chance(0.45)) {
        for (var d = 0; d < rint(2, 4); d++) M.dot(ctx, x + rnd(-s * 1.5, s * 1.5), y - rnd(s * 0.6, s * 1.4), rnd(0.3, 0.7), { alpha: rnd(0.18, 0.34) });
      }
    },
    mouth: function (ctx) {
      var x = rnd(42, 56), y = rnd(46, 56), w = rnd(20, 26), o = rnd(3.8, 6.4);
      var lipD = '#6f322c', lipR = '#c4564a';
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rnd(-0.09, 0.09));
      var up = [{ x: -w / 2, y: 0 }, { x: -w * 0.28, y: -o * 1.02 }, { x: -w * 0.05, y: -o * 0.6 },
        { x: w * 0.06, y: -o * 0.64 }, { x: w * 0.29, y: -o * 0.98 }, { x: w / 2, y: 0 }];
      var lo = [{ x: -w / 2, y: 0 }, { x: -w * 0.24, y: o * 0.95 }, { x: 0, y: o * 1.18 },
        { x: w * 0.25, y: o * 0.92 }, { x: w / 2, y: 0 }];
      var upO = [{ x: -w * 0.52, y: -o * 0.42 }, { x: -w * 0.3, y: -o * 1.9 }, { x: -w * 0.13, y: -o * 2.16 },
        { x: 0, y: -o * 1.62 }, { x: w * 0.14, y: -o * 2.12 }, { x: w * 0.31, y: -o * 1.84 }, { x: w * 0.52, y: -o * 0.4 }];
      var loO = [{ x: -w * 0.52, y: -o * 0.28 }, { x: -w * 0.26, y: o * 1.7 }, { x: 0, y: o * 2.16 },
        { x: w * 0.27, y: o * 1.66 }, { x: w * 0.52, y: -o * 0.26 }];
      // 填色前先加密，几个拐点连起来就是硬边多边形
      var upS = M.smooth(up, 5), loS = M.smooth(lo, 5), upOS = M.smooth(upO, 6), loOS = M.smooth(loO, 6);
      function poly(pts) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
      }
      // 唇体：上唇一道、下唇一道，中间夹着口缝
      var lg = ctx.createLinearGradient(0, -o * 2.2, 0, o * 2.2);
      lg.addColorStop(0, M.colA(lipR, 0.5));
      lg.addColorStop(0.45, M.colA('#d9705c', 0.42));
      lg.addColorStop(0.62, M.colA(lipR, 0.56));
      lg.addColorStop(1, M.colA('#9c3a32', 0.4));
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(upOS[0].x, upOS[0].y);
      for (var i = 1; i < upOS.length; i++) ctx.lineTo(upOS[i].x, upOS[i].y);
      for (var j = loOS.length - 1; j >= 0; j--) ctx.lineTo(loOS[j].x, loOS[j].y);
      ctx.closePath(); ctx.fill();
      ctx.save();
      poly(upOS); ctx.clip();
      ctx.fillStyle = M.colA('#f7ddcb', 0.3);
      ctx.beginPath(); ctx.ellipse(-w * 0.2, -o * 1.42, w * 0.18, o * 0.3, -0.2, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * 0.22, -o * 1.4, w * 0.16, o * 0.26, 0.2, 0, 6.2832); ctx.fill();
      ctx.restore();
      // 口缝：一片深墨，里面留舌与齿
      var openP = upS.concat(loS.slice().reverse());
      ctx.beginPath();
      ctx.moveTo(openP[0].x, openP[0].y);
      for (var k = 1; k < openP.length; k++) ctx.lineTo(openP[k].x, openP[k].y);
      ctx.closePath();
      var og = ctx.createLinearGradient(0, -o, 0, o * 1.3);
      og.addColorStop(0, M.colA('#2f2620', 0.82));
      og.addColorStop(0.6, M.colA('#4a2b26', 0.7));
      og.addColorStop(1, M.colA('#a8503f', 0.6));
      ctx.save(); ctx.fillStyle = og; ctx.fill(); ctx.clip();
      ctx.fillStyle = M.colA('#b8574a', 0.62);
      ctx.beginPath(); ctx.ellipse(0, o * 1.05, w * 0.3, o * 0.62, 0, 0, 6.2832); ctx.fill();
      for (var tt = 0; tt < 3; tt++) {
        ctx.fillStyle = M.colA('#f4ecd9', 0.46 - tt * 0.08);
        ctx.fillRect(-w * 0.19 + tt * w * 0.14, -o * 0.8, w * 0.11, o * 0.36);
      }
      ctx.restore();
      // 唇线：只有口缝那两条落重墨
      M.stroke(ctx, up, { w: w * 0.05, w2: w * 0.018, alpha: 0.7, color: lipD, profile: 'brush', seg: 7, cap: false });
      M.stroke(ctx, lo, { w: w * 0.045, w2: w * 0.016, alpha: 0.64, color: lipD, profile: 'brush', seg: 7, cap: false });
      M.stroke(ctx, upO, { w: w * 0.03, w2: w * 0.012, alpha: 0.34, color: lipD, profile: 'flat', seg: 8, dry: 0.4, cap: false });
      M.stroke(ctx, loO, { w: w * 0.028, w2: w * 0.01, alpha: 0.3, color: lipD, profile: 'flat', seg: 8, dry: 0.4, cap: false });
      // 嘴角两点，加两笔细纹
      for (var c = 0; c < 2; c++) {
        var sx = c ? w / 2 : -w / 2;
        M.dot(ctx, sx, -o * 0.06, w * 0.035, { color: lipD, alpha: 0.8 });
        M.stroke(ctx, [{ x: sx, y: 0 }, { x: sx + (c ? 1 : -1) * w * 0.1, y: o * (c ? 0.34 : 0.28) }],
          { w: w * 0.022, w2: 0.1, alpha: 0.34, color: lipD, profile: 'taper', seg: 5, cap: false });
      }
      // 人中
      M.stroke(ctx, [{ x: 0, y: -o * 1.66 }, { x: w * 0.02, y: -o * 2.5 }],
        { w: w * 0.022, w2: 0.1, alpha: 0.3, color: '#6b6154', profile: 'taper', seg: 5, cap: false });
      ctx.restore();
      // 说话的气：三弧不等距，贴着嘴角外头
      var side = chance(0.5) ? 1 : -1;
      for (var sN = 0; sN < 3; sN++) {
        var rr = w * (0.34 + sN * rnd(0.2, 0.3));
        ctx.save();
        ctx.strokeStyle = M.hexA(INK, 0.24 - sN * 0.05);
        ctx.lineWidth = Math.max(0.35, w * 0.03);
        ctx.beginPath();
        ctx.arc(x + side * (w * 0.56 + rr * 0.32), y - o * 0.2, rr, side > 0 ? -0.8 : 2.34, side > 0 ? 0.8 : 3.94);
        ctx.stroke();
        ctx.restore();
      }
      M.wash(ctx, x, y + o * 2.8, w * 0.9, o * 0.9, { color: INK, alpha: 0.08 });
    },

    eye: function (ctx) {
      var x = rnd(42, 58), y = rnd(48, 58), w = rnd(30, 40), h = w * rnd(0.36, 0.42);
      var up = [], lo = [], n = 14;
      for (var i = 0; i <= n; i++) {
        var t = i / n, px = -w / 2 + w * t;
        up.push({ x: px, y: -Math.sin(Math.PI * Math.pow(t, 0.8)) * h - t * h * 0.06 });
        lo.push({ x: px, y: Math.sin(Math.PI * Math.pow(t, 1.2)) * h * 0.52 - t * h * 0.06 });
      }
      ctx.save();
      ctx.translate(x, y);
      function ball() {
        ctx.beginPath();
        ctx.moveTo(up[0].x, up[0].y);
        for (var a = 1; a < up.length; a++) ctx.lineTo(up[a].x, up[a].y);
        for (var b = lo.length - 1; b >= 0; b--) ctx.lineTo(lo[b].x, lo[b].y);
        ctx.closePath();
      }
      var wg = ctx.createLinearGradient(0, -h, 0, h * 0.6);
      wg.addColorStop(0, M.colA('#a89a80', 0.5));
      wg.addColorStop(0.4, M.colA('#f7f1e2', 0.8));
      wg.addColorStop(1, M.colA('#dfd3ba', 0.55));
      ctx.fillStyle = wg; ball(); ctx.fill();
      ctx.save(); ball(); ctx.clip();
      // 瞳仁只占眼高，撑满眼形就是卡通大眼
      var cx2 = rnd(-w * 0.05, w * 0.03), cy2 = -h * 0.02, ir = h * rnd(0.66, 0.74);
      var ig = ctx.createRadialGradient(cx2, cy2, ir * 0.2, cx2, cy2, ir);
      ig.addColorStop(0, M.colA('#5a5044', 0.82));
      ig.addColorStop(0.5, M.colA('#3d372f', 0.82));
      ig.addColorStop(0.84, M.colA('#241f1a', 0.88));
      ig.addColorStop(1, M.colA('#6f6455', 0.3));
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.arc(cx2, cy2, ir, 0, 6.2832); ctx.fill();
      ctx.fillStyle = M.colA('#191612', 0.92);
      ctx.beginPath(); ctx.arc(cx2, cy2, ir * 0.3, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = M.colA('#7a6e5c', 0.3); ctx.lineWidth = Math.max(0.25, ir * 0.05);
      for (var rk = 0; rk < 9; rk++) {
        var ra = rk / 9 * 6.2832 + rnd(-0.1, 0.1);
        ctx.beginPath();
        ctx.moveTo(cx2 + Math.cos(ra) * ir * 0.44, cy2 + Math.sin(ra) * ir * 0.44);
        ctx.lineTo(cx2 + Math.cos(ra) * ir * 0.82, cy2 + Math.sin(ra) * ir * 0.82);
        ctx.stroke();
      }
      ctx.fillStyle = M.colA('#fbf6ea', 0.82);
      ctx.beginPath(); ctx.arc(cx2 - ir * 0.34, cy2 - ir * 0.36, ir * 0.15, 0, 6.2832); ctx.fill();
      ctx.fillStyle = M.colA('#f7f0e0', 0.3);
      ctx.beginPath(); ctx.arc(cx2 + ir * 0.34, cy2 + ir * 0.4, ir * 0.08, 0, 6.2832); ctx.fill();
      // 上睑压在球面上的一片阴
      ctx.fillStyle = M.colA('#5a4f42', 0.2);
      ctx.beginPath(); ctx.ellipse(0, -h * 0.92, w * 0.5, h * 0.4, 0, 0, 6.2832); ctx.fill();
      ctx.restore();
      // 上睑一线：内眦细、到外眦才压重，两头收死
      M.stroke(ctx, up, { w: w * 0.05, w2: w * 0.016, alpha: 0.8, color: M.darken(INK, 0.7), profile: 'brush', seg: 8, cap: false });
      M.stroke(ctx, up.map(function (p) { return { x: p.x, y: p.y - h * 0.26 }; }).slice(3, 13),
        { w: w * 0.022, w2: w * 0.006, alpha: 0.24, color: INK, profile: 'taper', seg: 8, dry: 0.45, cap: false });
      M.stroke(ctx, lo, { w: w * 0.03, w2: w * 0.01, alpha: 0.5, color: INK, profile: 'flat', seg: 8, cap: false });
      M.stroke(ctx, lo.map(function (p) { return { x: p.x, y: p.y + h * 0.26 }; }).slice(4, 11),
        { w: w * 0.02, w2: 0.1, alpha: 0.16, color: INK, profile: 'taper', seg: 7, cap: false });
      // 睫毛只长在外侧三分之一，三四根、长短不齐
      for (var L = 0; L < rint(3, 4); L++) {
        var li = up[up.length - 1 - L];
        if (!li) break;
        var la = -0.5 - L * rnd(0.16, 0.26);
        var ll = w * (0.1 - L * 0.018) * rnd(0.8, 1.15);
        M.stroke(ctx, [li, { x: li.x + Math.cos(la) * ll, y: li.y + Math.sin(la) * ll }],
          { w: w * 0.018, w2: 0.08, alpha: 0.55, color: M.darken(INK, 0.72), profile: 'taper', seg: 4, cap: false });
      }
      ctx.restore();
      // 眉：一笔干墨挑过去，梢上扫散
      var bx = x - w * 0.52, by = y - h * 2.3;
      var brow = [{ x: bx, y: by + h * 0.2 }, { x: bx + w * 0.4, y: by - h * 0.12 }, { x: bx + w * 0.76, y: by + h * 0.3 }];
      M.stroke(ctx, brow, { w: w * 0.062, w2: w * 0.012, alpha: 0.55, color: INK, profile: 'brush', seg: 8, dry: 0.6, cap: false });
      M.stroke(ctx, nudge(brow, h * 0.16), { w: w * 0.024, w2: 0.1, alpha: 0.2, color: INK, profile: 'taper', seg: 9, dry: 0.7, cap: false });
      M.wash(ctx, x, y + h * 1.3, w * 0.7, h * 0.3, { color: INK, alpha: 0.06 });
    },

    ear: function (ctx) {
      // 耳：一条耳轮走到底，里面靠双线和不规则的暗影撑出体积。铺一块亮饼就是蜗牛壳
      var x = rnd(48, 58), y = rnd(44, 54), h = rnd(34, 42);
      var dk = M.darken(INK, 0.7);
      ctx.save();
      ctx.translate(x, y); ctx.scale(chance(0.5) ? 1 : -1, 1); ctx.rotate(rnd(-0.06, 0.1));
      var helix = [], n = 17;
      for (var i = 0; i <= n; i++) {
        var a = -1.78 + (i / n) * 3.42;
        var rr = h * 0.43 * (1 + 0.11 * Math.sin(i / n * 3.1416)) * (1 - 0.06 * (i / n));
        helix.push({ x: Math.cos(a) * rr * 0.76 + h * 0.05 + rnd(-h * 0.008, h * 0.008), y: Math.sin(a) * rr });
      }
      // 耳后一层很淡的影，把耳朵从纸上托起来，不铺满
      M.wash(ctx, h * 0.16, -h * 0.06, h * 0.34, h * 0.5, { color: '#b3a688', alpha: 0.14 });
      // 耳轮：下粗上细的一笔，收在耳垂上
      M.stroke(ctx, helix, { w: h * 0.07, w2: h * 0.03, alpha: 0.72, color: dk, profile: 'swell', seg: 7, dry: 0.2, cap: false });
      // 里侧再走一条平行的细线，双钩才 Fold 得起来
      var inner = helix.map(function (p) { return { x: p.x - h * 0.085, y: p.y + h * 0.015 }; });
      M.stroke(ctx, inner.slice(3, 12), { w: h * 0.026, w2: h * 0.01, alpha: 0.26, color: dk, profile: 'flat', seg: 8, dry: 0.4, cap: false });
      // 对耳轮：两支细叉，别压过耳轮
      M.stroke(ctx, [{ x: -h * 0.1, y: -h * 0.22 }, { x: -h * 0.01, y: -h * 0.04 }, { x: -h * 0.02, y: h * 0.18 }, { x: h * 0.08, y: h * 0.32 }],
        { w: h * 0.034, w2: h * 0.014, alpha: 0.4, color: dk, profile: 'flat', seg: 8, cap: false });
      M.stroke(ctx, [{ x: -h * 0.01, y: -h * 0.05 }, { x: h * 0.14, y: -h * 0.14 }],
        { w: h * 0.026, w2: 0.008, alpha: 0.3, color: dk, profile: 'taper', seg: 6, cap: false });
      // 心窝的影只落在下半，道口前留亮
      M.wash(ctx, -h * 0.03, h * 0.14, h * 0.2, h * 0.24, { color: INK, alpha: 0.16 });
      // 耳屏一小钩挡在道口前
      M.stroke(ctx, [{ x: -h * 0.22, y: -h * 0.1 }, { x: -h * 0.14, y: h * 0.04 }, { x: -h * 0.22, y: h * 0.14 }],
        { w: h * 0.042, w2: h * 0.014, alpha: 0.42, color: dk, profile: 'flat', seg: 5, cap: false });
      // 道口：一点湿墨，不是圆钉
      M.stroke(ctx, [{ x: -h * 0.11, y: -h * 0.05 }, { x: -h * 0.07, y: h * 0.02 }],
        { w: h * 0.05, w2: h * 0.02, alpha: 0.55, color: '#241f1a', profile: 'taper', seg: 4, cap: false });
      // 耳垂：耳轮收住后往下兜一小圈
      var lob = helix[helix.length - 1];
      M.stroke(ctx, [{ x: lob.x + h * 0.02, y: lob.y - h * 0.02 }, { x: lob.x - h * 0.1, y: lob.y + h * 0.12 }, { x: lob.x - h * 0.24, y: lob.y + h * 0.06 }],
        { w: h * 0.04, w2: h * 0.014, alpha: 0.45, color: dk, profile: 'flat', seg: 6, cap: false });
      M.wash(ctx, lob.x - h * 0.1, lob.y + h * 0.04, h * 0.14, h * 0.12, { color: '#c3b493', alpha: 0.24 });
      // 鬓发两三笔扫在耳后，长短疏密都不同——齐排就成梳齿
      var hn = rint(2, 3);
      for (var hr = 0; hr < hn; hr++) {
        var hy0 = -h * rnd(0.42, 0.5), hx0 = -h * rnd(0.4, 0.52);
        M.stroke(ctx, [{ x: hx0, y: hy0 }, { x: hx0 - h * rnd(0.1, 0.22), y: hy0 + h * rnd(0.3, 0.44) },
          { x: hx0 - h * rnd(0.04, 0.16), y: hy0 + h * rnd(0.6, 0.9) }],
          { w: h * rnd(0.03, 0.05), w2: 0.01, alpha: rnd(0.22, 0.34), color: dk, profile: 'brush', seg: 8, dry: 0.7, cap: false });
      }
      // 下颌一线，把耳朵接到脸上
      M.stroke(ctx, [{ x: -h * 0.78, y: -h * 0.52 }, { x: -h * 0.92, y: h * 0.1 }, { x: -h * 0.62, y: h * 0.74 }],
        { w: h * 0.02, w2: 0.1, alpha: 0.18, color: INK, profile: 'taper', seg: 10, dry: 0.5, cap: false });
      ctx.restore();
      // 声音从外头进来：三圈细弧，压在耳上就成了花纹
      for (var sN = 0; sN < 3; sN++) {
        var rr2 = h * (0.14 + sN * 0.11);
        var sd = h * (0.98 + sN * 0.22);
        ctx.save();
        ctx.strokeStyle = M.hexA(BLUE, 0.2 - sN * 0.05);
        ctx.lineWidth = Math.max(0.3, h * 0.02);
        ctx.beginPath();
        ctx.arc(x - sd, y - h * 0.04, rr2, -0.66, 0.66);
        ctx.stroke();
        ctx.restore();
      }
      M.wash(ctx, x, y + h * 0.86, h * 0.9, h * 0.18, { color: INK, alpha: 0.07 });
      M.air(ctx, x + h * 0.8, y - h * 0.7, 12, 7, {});
    },
    head: function (ctx) {
      // 首：挽总角的小儿。髻长在发里，发压上脸，衣接住颈——一层断开一层就是拼贴
      var x = rnd(44, 56), y = rnd(40, 46), r = rnd(20, 25), dir = chance(0.5) ? 1 : -1;
      var dk = M.darken(INK, 0.66);
      function poly(pts) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
      }
      ctx.save();
      ctx.translate(x, y); ctx.scale(dir, 1);
      // 衣：肩一路垂到画外，浮着的半身最露怯
      var rb = [{ x: -r * 1.46, y: r * 2.1 }, { x: -r * 0.7, y: r * 1.44 }, { x: 0, y: r * 1.28 },
        { x: r * 0.72, y: r * 1.46 }, { x: r * 1.48, y: r * 2.12 }, { x: r * 1.26, y: r * 3.5 },
        { x: -r * 1.3, y: r * 3.5 }];
      var rbg = ctx.createLinearGradient(0, r * 1.2, 0, r * 3.5);
      rbg.addColorStop(0, M.colA('#d3c8b2', 0.52));
      rbg.addColorStop(1, M.colA('#877f70', 0.3));
      ctx.fillStyle = rbg; poly(M.smooth(rb, 4)); ctx.fill();
      M.stroke(ctx, rb.slice(0, 6), { w: r * 0.06, w2: r * 0.022, alpha: 0.52, color: dk, profile: 'flat', seg: 8, dry: 0.34, cap: false });
      // 交领：一深一浅压在胸前，别画成两条平行的白线
      M.stroke(ctx, [{ x: -r * 0.34, y: r * 1.34 }, { x: -r * 0.02, y: r * 1.62 }, { x: r * 0.42, y: r * 1.9 }],
        { w: r * 0.05, w2: r * 0.018, alpha: 0.55, color: dk, profile: 'flat', seg: 6, cap: false });
      M.stroke(ctx, nudge([{ x: -r * 0.34, y: r * 1.34 }, { x: -r * 0.02, y: r * 1.62 }, { x: r * 0.42, y: r * 1.9 }], r * 0.05),
        { w: r * 0.035, w2: r * 0.012, alpha: 0.4, color: '#efe6d2', profile: 'flat', seg: 6, cap: false });
      // 颈：一块实的从下巴坐到肩上
      ctx.save();
      poly([{ x: -r * 0.28, y: r * 0.6 }, { x: -r * 0.32, y: r * 1.1 }, { x: -r * 0.36, y: r * 1.32 },
        { x: r * 0.38, y: r * 1.32 }, { x: r * 0.34, y: r * 1.08 }, { x: r * 0.28, y: r * 0.6 }]);
      var ng = ctx.createLinearGradient(0, r * 0.6, 0, r * 1.36);
      ng.addColorStop(0, M.colA('#e6d8bb', 0.66));
      ng.addColorStop(1, M.colA('#9c8b70', 0.46));
      ctx.fillStyle = ng; ctx.fill();
      ctx.restore();
      // 脸：上宽下收，正圆就是一颗蛋
      var fa = [];
      for (var i = 0; i <= 16; i++) {
        var a = i / 16 * 6.2832 - 1.5708, sy = Math.sin(a);
        var ww = r * (0.74 + 0.05 * Math.cos(a * 2)) * (sy > 0 ? 1 - 0.26 * sy : 1);
        fa.push({ x: Math.cos(a) * ww, y: sy * r });
      }
      var fg = ctx.createLinearGradient(-r * 0.6, -r, r * 0.5, r);
      fg.addColorStop(0, M.colA('#f9f2e2', 0.9));
      fg.addColorStop(0.62, M.colA('#ead9bd', 0.82));
      fg.addColorStop(1, M.colA('#b6a484', 0.5));
      ctx.fillStyle = fg; poly(fa); ctx.fill();
      ctx.save(); poly(fa); ctx.clip();
      ctx.fillStyle = M.colA(RED, 0.05);
      ctx.beginPath(); ctx.ellipse(r * 0.4, r * 0.3, r * 0.22, r * 0.12, 0, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-r * 0.38, r * 0.32, r * 0.19, r * 0.1, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = M.colA('#6a6252', 0.14);
      ctx.beginPath(); ctx.ellipse(-r * 0.72, r * 0.1, r * 0.26, r * 0.62, 0, 0, 6.2832); ctx.fill();
      ctx.restore();
      // 发：压住上半张脸，下缘一条不齐的弧，两侧略出界
      var hm = [{ x: -r * 1.0, y: -r * 0.14 }];
      for (var h2 = 0; h2 <= 10; h2++) {
        var ha = Math.PI * (1 - h2 / 10);
        hm.push({ x: Math.cos(ha) * r * 1.03, y: -Math.sin(ha) * r * (0.99 + 0.04 * Math.cos(h2 * 1.7)) });
      }
      hm.push({ x: r * 0.98, y: -r * 0.2 });
      hm.push({ x: r * 0.6, y: -r * 0.4 }, { x: r * 0.18, y: -r * 0.28 }, { x: -r * 0.26, y: -r * 0.44 },
        { x: -r * 0.68, y: -r * 0.32 }, { x: -r * 1.0, y: -r * 0.14 });
      ctx.fillStyle = M.colA(dk, 0.88); poly(M.smooth(hm, 3)); ctx.fill();
      // 总角：两枚髻贴在发顶上，压进发里，不靠棍子撑
      for (var g2 = 0; g2 < 2; g2++) {
        var gx = g2 ? r * 0.58 : -r * 0.6, gy = -r * (g2 ? 1.0 : 1.04), gr = r * (g2 ? 0.21 : 0.19);
        ctx.fillStyle = M.colA(dk, 0.9);
        ctx.beginPath(); ctx.ellipse(gx, gy, gr, gr * 0.86, (g2 ? 0.3 : -0.28), 0, 6.2832); ctx.fill();
        M.stroke(ctx, [{ x: gx - gr * 0.8, y: gy + gr * 0.92 }, { x: gx, y: gy + gr * 1.12 }, { x: gx + gr * 0.8, y: gy + gr * 0.86 }],
          { w: r * 0.05, w2: r * 0.02, alpha: 0.6, color: RED, profile: 'flat', seg: 4, cap: false });
      }
      // 刘海：三笔长短俯仰都不同
      for (var hz = 0; hz < 3; hz++) {
        var hx = -r * 0.44 + hz * r * 0.4;
        M.stroke(ctx, [{ x: hx, y: -r * 0.42 }, { x: hx + r * rnd(-0.08, 0.16), y: -r * (0.16 + rnd(0, 0.14)) }],
          { w: r * 0.07, w2: 0.1, alpha: 0.42, color: dk, profile: 'taper', seg: 5, cap: false });
      }
      // 眉眼：睁着的——一小块眼白压一点瞳，只画两道弧就是闭眼
      for (var e = 0; e < 2; e++) {
        var ex = e ? r * 0.36 : -r * 0.34, ey = r * 0.06, ew = r * 0.18, eh = r * 0.1;
        var lid = [{ x: ex - ew, y: ey }, { x: ex - ew * 0.15, y: ey - eh * 1.9 }, { x: ex + ew, y: ey - eh * 0.15 }];
        var bot = [{ x: ex - ew, y: ey }, { x: ex + ew * 0.15, y: ey + eh * 1.35 }, { x: ex + ew, y: ey - eh * 0.15 }];
        var eye = M.smooth(lid.concat(bot.slice(1, 3)), 3);
        ctx.save(); poly(eye); ctx.clip();
        ctx.fillStyle = M.colA('#f8f3e6', 0.86); ctx.fillRect(ex - ew * 1.2, ey - eh * 2.2, ew * 2.4, eh * 4);
        ctx.fillStyle = M.colA('#221e19', 0.88);
        ctx.beginPath(); ctx.arc(ex + r * 0.01, ey - eh * 0.2, r * 0.082, 0, 6.2832); ctx.fill();
        ctx.restore();
        M.stroke(ctx, lid, { w: r * 0.045, w2: r * 0.016, alpha: 0.82, color: '#241f1a', profile: 'flat', seg: 6, cap: false });
        M.stroke(ctx, bot, { w: r * 0.018, w2: 0.006, alpha: 0.3, color: dk, profile: 'flat', seg: 6, cap: false });
        M.stroke(ctx, [{ x: ex - r * 0.2, y: ey - r * 0.34 }, { x: ex + r * 0.18, y: ey - r * 0.44 }],
          { w: r * 0.04, w2: 0.01, alpha: 0.34, color: dk, profile: 'taper', seg: 5, dry: 0.55, cap: false });
      }
      M.stroke(ctx, [{ x: r * 0.02, y: r * 0.14 }, { x: r * 0.1, y: r * 0.28 }, { x: -r * 0.04, y: r * 0.34 }],
        { w: r * 0.028, w2: r * 0.01, alpha: 0.4, color: dk, profile: 'flat', seg: 5, cap: false });
      M.stroke(ctx, [{ x: -r * 0.11, y: r * 0.46 }, { x: r * 0.02, y: r * 0.53 }, { x: r * 0.14, y: r * 0.45 }],
        { w: r * 0.03, w2: r * 0.012, alpha: 0.55, color: '#8a4038', profile: 'flat', seg: 5, cap: false });
      // 耳一小枚贴在远侧，别拖成一条竖线
      M.stroke(ctx, [{ x: -r * 0.78, y: r * 0.06 }, { x: -r * 0.7, y: r * 0.18 }, { x: -r * 0.76, y: r * 0.3 }],
        { w: r * 0.034, w2: r * 0.014, alpha: 0.24, color: dk, profile: 'flat', seg: 5, cap: false });
      ctx.restore();
      M.wash(ctx, x, y + r * 3.2, r * 2.4, r * 0.3, { color: INK, alpha: 0.12 });
      M.air(ctx, x + dir * r * 2.1, y - r * 1.5, 12, 7, {});
    },
    fly: function (ctx) {
      // 蝇：近景一只就够，复眼、纱翅、六条腿都要数得清；远处两只只做陪衬
      var bx = rnd(30, 58), by = rnd(56, 72);
      // 一片吃剩的瓜皮，蝇才有落脚的东西
      ctx.save();
      var rg = ctx.createLinearGradient(0, by + 6, 0, by + 26);
      rg.addColorStop(0, M.colA('#7d8f5a', 0.5));
      rg.addColorStop(0.42, M.colA('#dfe3c4', 0.6));
      rg.addColorStop(1, M.colA('#c9b88a', 0.4));
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(bx - 22, by + 12);
      ctx.quadraticCurveTo(bx, by + 30, bx + 24, by + 13);
      ctx.quadraticCurveTo(bx, by + 2, bx - 22, by + 12);
      ctx.fill();
      ctx.strokeStyle = M.hexA('#5d6a45', 0.5);
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.restore();
      var s = rnd(17, 22);
      bug(ctx, bx + rnd(-6, 6), by + rnd(-4, 2), s, {
        ang: rnd(-0.5, 0.2), dir: chance(0.5) ? 1 : -1, segs: 3, legs: 3, legReach: 0.58,
        hairN: 6, hairLen: 0.06, wing2: true, eyes: '#6b2f2a', eyeR: 0.11, wingRot: -0.85,
        color: M.darken(INK, 0.85)
      });
      // 另一只正在飞，尾巴拖一道折来折去的线
      var fx = rnd(62, 88), fy = rnd(20, 42);
      var tr = curve(fx, fy, rnd(2.4, 3.8), rnd(18, 30), 12, 0, 0.3);
      M.stroke(ctx, tr, { w: 0.4, w2: 0.15, alpha: 0.22, color: INK, profile: 'flat', seg: 10, cap: false });
      bug(ctx, fx, fy, rnd(9, 12), { ang: rnd(-0.8, 0.8), segs: 3, legs: 3, wingRot: -1.1, color: M.darken(INK, 0.85) });
      // 爬过的脚印：两排针尖大的点
      for (var p = 0; p < rint(6, 11); p++) {
        var pa = rnd(0.2, 1.1);
        var pd = 3 + p * rnd(1.6, 2.6);
        M.dot(ctx, bx - 14 + Math.cos(pa) * pd, by + 16 + Math.sin(pa) * pd * 0.4, rnd(0.25, 0.5),
          { color: INK, alpha: rnd(0.28, 0.5) });
      }
      M.wash(ctx, 50, 90, 40, 8, { color: INK, alpha: 0.07 });
    },

    bigsmall: function (ctx) {
      // 大小：同一样东西并排画两枚，脚踩同一条地平，差到三倍——隔着距离比大小是无效比较
      var dir = chance(0.5) ? 1 : -1;
      var s = rnd(20, 24), y = rnd(44, 50);
      var bx = clamp(50 - dir * s * 0.7, 12 + s * 1.7, 88 - s * 1.7);
      var col = chance(0.35) ? '#5a5044' : INK;
      var opt = {
        dir: dir, color: col, alpha: 0.74, hump: -0.2, depth: 0.36,
        neck: { ang: -1.0, len: 0.62, w: 0.42 }, neckCurl: 0.08,
        head: 'muzzle', headLen: 0.45, muzzleDip: 0.22,
        legLen: 1.0, legW: 0.14, mane: true, tail: 1.05, tailHair: true, tailCurl: 0.16
      };
      beast(ctx, bx, y, s, opt);
      var fs = s * rnd(0.4, 0.48);
      // 驹就是同一匹缩小，换个头色、换套身段就成了另一个物种
      var small = { dir: dir, color: col, alpha: 0.6, hump: -0.2, depth: 0.36,
        neck: { ang: -0.96, len: 0.6, w: 0.44 }, neckCurl: 0.07,
        head: 'muzzle', headLen: 0.44, muzzleDip: 0.22,
        legLen: 1.0, legW: 0.16, mane: true, tail: 0.85, tailHair: true, tailCurl: 0.14 };
      beast(ctx, bx + dir * s * 1.5, y + (s - fs) * 1.3, fs, small);
      // 共用的地：一条横线加几撮草
      M.stroke(ctx, [{ x: bx - s * 2.1, y: y + s * 1.32 }, { x: bx + dir * s * 3, y: y + s * 1.36 }],
        { w: 1.3, w2: 0.25, alpha: 0.3, profile: 'flat', seg: 13 });
      for (var g = 0; g < rint(4, 8); g++) {
        var gx = bx + rnd(-s * 2, s * 3), gy = y + s * 1.3 + rnd(0, 2.5);
        M.stroke(ctx, [{ x: gx, y: gy }, { x: gx + rnd(-1.6, 1.6), y: gy - rnd(2, 4.6) }],
          { w: 0.5, w2: 0.1, alpha: rnd(0.2, 0.42), profile: 'taper', seg: 5, cap: false });
      }
      M.wash(ctx, 50, 88, 44, 7, { color: INK, alpha: 0.06 });
    },

    updown: function (ctx) {
      // 上下：天上一只往高里飞的，水底一条往深里游的，中间那道地平就是分界
      var wy = rnd(56, 64);
      cloudBands(ctx, rnd(14, 26), rint(2, 3), { alpha: 0.1 });
      var bu = rnd(30, 60), by = rnd(20, 32);
      flyBird(ctx, bu, by, rnd(11, 15), { ang: rnd(-1.15, -0.65), phase: rnd(-0.5, 0.5), fork: rnd(0.2, 0.5) });
      if (chance(0.65)) flyBird(ctx, bu + rnd(14, 26), by + rnd(6, 14), rnd(6, 9), { ang: rnd(-1.1, -0.7) });
      // 一道向上的气：从水面直冲上去，把上下缝在一起
      if (chance(0.5)) {
        var ri = curve(rnd(58, 78), wy - 4, -1.57, rnd(24, 36), 8, rnd(-0.1, 0.1), 0.12);
        M.stroke(ctx, ri, { w: 1.4, w2: 0.2, alpha: 0.16, color: INK, profile: 'taper', seg: 10, cap: false });
      }
      M.ridge(ctx, 2, 98, wy - 2, rnd(6, 10), 7, { alpha: 0.09, lw: 0.5, fade: true, seed: rnd(0, 6) });
      M.stroke(ctx, [{ x: -2, y: wy + 1 }, { x: 102, y: wy + 1.4 }],
        { w: 1.1, w2: 0.3, alpha: 0.26, profile: 'flat', seg: 14 });
      ripples(ctx, wy + 4, wy + rnd(16, 24), 4, { color: BLUE });
      // 鱼朝下游：隔着水就该淡一档，一坨实墨是贴在纸上的玩具
      var fx = rnd(30, 62), fy = wy + rnd(10, 17), fl = rnd(10, 14), fa = rnd(2.1, 3.1);
      var head = { x: fx + Math.cos(fa) * fl, y: fy + Math.sin(fa) * fl };
      var fcol = chance(0.4) ? '#7a4a3e' : '#3f4a4e';
      taperLeaf(ctx, fx, fy, fa, fl, fl * 0.32, { color: fcol, alpha: 0.44, bend: 0.24 });
      // 背鳍一笔，腹下一条水光
      M.stroke(ctx, [{ x: fx + Math.cos(fa) * fl * 0.42, y: fy + Math.sin(fa) * fl * 0.42 },
        { x: fx + Math.cos(fa - 1.57) * fl * 0.3, y: fy + Math.sin(fa - 1.57) * fl * 0.3 }],
        { w: fl * 0.1, w2: 0.08, alpha: 0.34, color: fcol, profile: 'taper', seg: 5, cap: false });
      M.stroke(ctx, [{ x: fx + Math.cos(fa) * fl * 0.2, y: fy + Math.sin(fa) * fl * 0.2 },
        { x: head.x - Math.cos(fa) * fl * 0.2, y: head.y - Math.sin(fa) * fl * 0.2 }],
        { w: fl * 0.07, w2: fl * 0.03, alpha: 0.3, color: '#f4ecd6', profile: 'flat', seg: 6, cap: false });
      for (var t = 0; t < 2; t++) {
        var ta = fa + Math.PI + (t ? 0.62 : -0.62);
        M.stroke(ctx, [{ x: fx, y: fy }, { x: fx + Math.cos(ta) * fl * 0.58, y: fy + Math.sin(ta) * fl * 0.58 }],
          { w: fl * 0.1, w2: 0.1, alpha: 0.4, color: fcol, profile: 'taper', seg: 5, cap: false });
      }
      M.dot(ctx, head.x - Math.cos(fa) * fl * 0.14, head.y - Math.sin(fa) * fl * 0.14, fl * 0.06, { color: '#f6efdc', alpha: 0.7 });
      // 身上压两道水纹，鱼才是沉在水里的
      for (var wv = 0; wv < 3; wv++) {
        M.stroke(ctx, [{ x: fx - fl * 0.4 + wv * fl * 0.5, y: fy - fl * 0.5 }, { x: fx - fl * 0.2 + wv * fl * 0.5, y: fy + fl * 0.5 }],
          { w: 0.6, w2: 0.2, alpha: 0.14, color: BLUE, profile: 'flat', seg: 5, cap: false });
      }
      // 水面上一点碎响，说明鱼刚沉下去
      var bb = { x: head.x + rnd(-4, 8), y: wy + rnd(0.5, 2.5) };
      ctx.save();
      ctx.strokeStyle = M.hexA(BLUE, 0.3); ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.ellipse(bb.x, bb.y, rnd(3, 6), rnd(0.8, 1.6), 0, 0, 6.2832); ctx.stroke();
      ctx.restore();
      if (chance(0.6)) M.moss(ctx, rnd(6, 22), wy + rnd(-1, 1.5), rint(2, 4), { spread: 3, min: 0.3, max: 0.7, alpha: 0.55 });
    },

    colorred: function (ctx) {
      // 红要有着落：一枝红梅，花、骨朵、落瓣，剩下半张纸被照一下
      var dir = chance(0.5) ? 1 : -1;
      var x0 = dir > 0 ? rnd(-2, 8) : rnd(92, 102);
      var y0 = rnd(76, 92);
      var main = curve(x0, y0, dir > 0 ? -0.62 : -2.5, rnd(52, 68), 6, dir > 0 ? -0.16 : 0.16, 0.12);
      limb(ctx, main, { w: 4.6, w2: 1.2, alpha: 0.72, dry: 0.5, washAlpha: 0.05 });
      var cand = [main[main.length - 1]];
      var twigs = [];
      for (var t = 0; t < rint(3, 4); t++) {
        var np = main[rint(2, main.length - 1)];
        var ang = (dir > 0 ? -1.2 : -1.94) + rnd(-0.8, 0.8);
        var tw = curve(np.x, np.y, ang, rnd(12, 19), 5, rnd(0.14, 0.3) * (ang > -1.57 ? 1 : -1), 0.1);
        limb(ctx, tw, { w: 2, w2: 0.5, alpha: 0.7, dry: 0.35, joints: false, washAlpha: 0.05 });
        twigs.push(tw);
        cand.push(tw[tw.length - 1]);
        if (chance(0.7)) cand.push({ x: np.x + rnd(-2, 2), y: np.y + rnd(-2, 2) });
      }
      cand = cand.filter(function (p) { return p.x > 6 && p.x < 94 && p.y > 8 && p.y < 84; });
      var put = [];
      for (var c = 0; c < cand.length && put.length < rint(4, 6); c++) {
        var q = cand[c], ok = true;
        for (var j = 0; j < put.length; j++) {
          if (Math.abs(put[j].x - q.x) < 11 && Math.abs(put[j].y - q.y) < 10) { ok = false; break; }
        }
        if (ok) put.push(q);
      }
      for (var f = 0; f < put.length; f++) {
        fiveFlower(ctx, put[f].x, put[f].y, rnd(5.5, 8), RED, rnd(0.82, 0.96), '#7d2b26');
      }
      // 骨朵：未开的只是两点红，比多开一朵更有气
      for (var b = 0; b < rint(2, 4); b++) {
        var tp = twigs.length ? twigs[rint(0, twigs.length - 1)] : main;
        var bp = tp[rint(1, tp.length - 1)];
        M.dot(ctx, bp.x + rnd(-2, 2), bp.y + rnd(-2, 2), rnd(0.9, 1.6), { color: '#a8342c', alpha: rnd(0.5, 0.75) });
      }
      // 落瓣三四片，越往下越淡
      for (var p2 = 0; p2 < rint(3, 5); p2++) {
        var px = rnd(20, 80), py = rnd(58, 88);
        M.petal(ctx, px, py, rnd(1.4, 2.4), rnd(1, 1.7), rnd(0, 3.14),
          { color: RED, base: '#f7e6d8', alpha: rnd(0.3, 0.55), edge: false });
      }
      M.wash(ctx, rnd(40, 62), rnd(52, 64), 46, 30, { color: RED, alpha: 0.07 });
      M.air(ctx, rnd(60, 86), rnd(20, 36), 18, 9, {});
    },
    tower: function (ctx) {
      var x = rnd(40, 60), y = rnd(80, 88), w = rnd(14, 20);
      // 楼阁：高台之上一层压一层，两片檐、一道平座
      var bh = w * 0.4;
      wall(ctx, x - w * 0.94, y - bh, x + w * 0.94, y, { alpha: 0.82 });
      M.stroke(ctx, [{ x: x - w * 0.3, y: y }, { x: x - w * 0.34, y: y - bh * 0.6 }, { x: x + w * 0.34, y: y - bh * 0.6 }, { x: x + w * 0.3, y: y }],
        { w: w * 0.03, alpha: 0.4, profile: 'flat', seg: 6, cap: false });
      var f0 = y - bh, h1 = w * 0.5;
      wall(ctx, x - w * 0.62, f0 - h1, x + w * 0.62, f0, { alpha: 0.78 });
      [-1, 1].forEach(function (sd) { post(ctx, x + sd * w * 0.52, f0 - h1 * 0.9, f0, w * 0.06, { alpha: 0.66 }); });
      eave(ctx, x, f0 - h1, w * 0.88, { rise: 0.32, flick: 0.16, sag: 0.08, alpha: 0.9 });
      var f1 = f0 - h1 - w * 0.24, h2 = w * 0.42;
      wall(ctx, x - w * 0.44, f1 - h2, x + w * 0.44, f1, { alpha: 0.74 });
      [-1, 1].forEach(function (sd) { post(ctx, x + sd * w * 0.36, f1 - h2 * 0.88, f1, w * 0.05, { alpha: 0.6 }); });
      var tp = eave(ctx, x, f1 - h2, w * 0.64, { rise: 0.4, flick: 0.18, sag: 0.08, alpha: 0.92 });
      M.stroke(ctx, [{ x: tp.tip.x, y: tp.tip.y }, { x: tp.tip.x, y: tp.tip.y - w * 0.24 }],
        { w: w * 0.05, w2: w * 0.03, alpha: 0.82, profile: 'flat', seg: 5, cap: false });
      M.dot(ctx, tp.tip.x, tp.tip.y - w * 0.3, w * 0.06, { alpha: 0.86 });
      M.stroke(ctx, [{ x: x - w * 2.2, y: y + w * 0.14 }, { x: x + w * 2.2, y: y + w * 0.14 }],
        { w: 1.3, w2: 0.3, alpha: 0.32, profile: 'flat', seg: 11 });
      M.wash(ctx, x, y + w * 0.24, w * 1.4, w * 0.16, { color: INK, alpha: 0.16 });
      if (chance(0.6)) M.ridge(ctx, x - w * 5, x - w * 1.6, y - w * rnd(0.6, 1.4), rnd(8, 14), 6, { alpha: 0.11, lw: 0.5, fade: true, seed: rnd(0, 6) });
      M.air(ctx, x, (f1 + y) / 2, w * 1.1, w * 1.4, {});
    },

    /* 通用：把字本身写成一幅墨 */
    glyph: function (ctx, o) {
      var ch = o.ch, x = 50, y = 48;
      var s = 54;
      M.wash(ctx, x, y, 40, 34, { color: INK, alpha: 0.07 });
      M.glyph(ctx, ch, x, y, s, { alpha: 0.88 });
      var pts = [];
      for (var i = 0; i < 3; i++) {
        var a = rnd(0, 6.28), d = rnd(24, 38);
        pts.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.8 });
      }
      M.stroke(ctx, pts, { w: 2.2, w2: 0.3, alpha: 0.22, profile: 'flat', seg: 10 });
      M.splatter(ctx, x, y, 40, 16, { alpha: 0.3, max: 1.2 });
      M.seal(ctx, x + 30, y + 14, 9, 9, '戏', { size: 6 });
    }
  };

  /* 收笔工序：雾气 + 苔点 + 偶落小印 */
  var GROUND = {
    mountain: 1, rock: 1, water: 1, wave: 1, mist: 1, bridge: 1, boat: 1, willow: 1, bamboo: 1,
    pine: 1, tree: 1, grass: 1, field: 1, earth: 1, road: 1, house: 1, pavilion: 1, pagoda: 1,
    gate: 1, tower: 1, person: 1, cart: 1, snow: 1, rainbow: 1
  };
  function finisher(ctx, key) {
    // 一层极淡的雾气托住主体：横向拉长，别成圆饼
    M.wash(ctx, rnd(40, 60), rnd(46, 62), 52, 16, { color: chance(0.3) ? BLUE : INK, alpha: 0.04 });
    // 苔点只长在有地的地方，且要贴着纸的下缘，不然就是浮在空中的墨渣
    if (GROUND[key]) {
      var my = rnd(88, 95);
      M.moss(ctx, rnd(16, 42), my, rint(2, 5), { spread: 6, min: 0.3, max: 0.8, alpha: 0.6 });
      if (chance(0.4)) M.moss(ctx, rnd(56, 84), my - rnd(0, 3), rint(2, 4), { spread: 5, min: 0.25, max: 0.6, alpha: 0.5 });
    }
    // 三成画补一枚小印，落在右下角的留白处
    if (chance(0.3)) {
      M.seal(ctx, rnd(80, 87), rnd(74, 84), 6.4, 6.8, '戏', { size: 4.6, alpha: 0.74 });
    }
  }

  global.MoMotifs = {
    has: function (k) { return typeof MOTIFS[k] === 'function'; },
    draw: function (ctx, key, o) {
      var fn = MOTIFS[key] || MOTIFS.glyph;
      // 某个母题的 save/restore 若差一层，不能把整张纸的坐标带歪
      ctx.save();
      try { fn(ctx, o || {}); } catch (e) { ctx.restore(); ctx.save(); MOTIFS.glyph(ctx, o || {}); }
      try { finisher(ctx, key); } catch (e2) { }
      ctx.restore();
    },
    keys: Object.keys(MOTIFS)
  };
})(window);
