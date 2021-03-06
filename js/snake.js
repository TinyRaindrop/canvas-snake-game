import { getRandomInt } from './util.js';

export class Snake {
  constructor(length, color, grid) {
    this.length = length > 1 ? length : 1;
    this.color = color;
    this.grid = grid;
    this.direction = this._getRandomDirection();
    this.head = this._getRandomStartPosition();
    this.tail = this._createTail();
    this.inputBuffer = [];
    this.alive = true;
    this.canGoThroughWalls = true;
    this.logCoordinates();
  }

  logCoordinates() {
    console.log(
      'Snake',
      this.head,
      this.tail.map((el) => `x:${el.x} y:${el.y}`),
      this.direction.name
    );
  }

  _getRandomDirection() {
    let directions = [
      { name: 'left', x: -1, y: 0 },
      { name: 'right', x: 1, y: 0 },
      { name: 'up', x: 0, y: -1 },
      { name: 'down', x: 0, y: 1 }
    ];
    return directions[getRandomInt(0, directions.length - 1)];
  }

  // Returns Head position such that Body doesn't touch borders
  _getRandomStartPosition() {
    let range = {};
    range.left = 1 + (this.direction.x > 0 ? this.length - 1 : 0);
    range.top = 1 + (this.direction.y > 0 ? this.length - 1 : 0);
    range.right = this.grid.columns - 2 - (this.direction.x < 0 ? this.length - 1 : 0);
    range.bottom = this.grid.rows - 2 - (this.direction.y < 0 ? this.length - 1 : 0);

    if (range.left > range.right || range.top > range.bottom) {
      console.log(range);
      throw 'Snake doesnt fit';
    }
    let x = getRandomInt(range.left, range.right);
    let y = getRandomInt(range.top, range.bottom);
    return { x, y };
  }

  _createTail() {
    let tail = [];
    for (let i = 1; tail.length < this.length - 1; i++) {
      tail.push({
        x: this.head.x - this.direction.x * i,
        y: this.head.y - this.direction.y * i
      });
    }
    return tail;
  }

  draw(ctx) {
    ctx.fillStyle = this.color.tail;
    this.tail.forEach((segment) => {
      ctx.fillRect(
        segment.x * this.grid.scale,
        segment.y * this.grid.scale,
        this.grid.scale,
        this.grid.scale
      );
    });

    ctx.fillStyle = this.color.head;
    ctx.fillRect(
      this.head.x * this.grid.scale,
      this.head.y * this.grid.scale,
      this.grid.scale,
      this.grid.scale
    );
  }

  animate(ctx, distance) {
    let rect = this.getAnimationCoordinates(this.head, this.direction, distance);
    // let rect = this.getAnimationCoordinates(this.tail[0], this.direction, distance);
    if (rect.w && rect.h) {
      // ctx.fillStyle = this.color.head;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
  }

  getAnimationCoordinates(segment, direction, distance) {
    let rectangle = {
      x: this.head.x,
      y: this.head.y,
      w: this.direction.x === 0 ? 1 : distance,
      h: this.direction.y === 0 ? 1 : distance
    };
    if (this.direction.x !== 0) rectangle.x += this.direction.x < 0 ? -distance : 1;
    if (this.direction.y !== 0) rectangle.y += this.direction.y < 0 ? -distance : 1;
    for (let key in rectangle) rectangle[key] = ~~(rectangle[key] * this.grid.scale);

    if (this.direction.x < 0) rectangle.w++;
    if (this.direction.y < 0) rectangle.h++;
    return rectangle;
  }

  move() {
    if (this.tail.length) {
      this.tail.unshift({ x: this.head.x, y: this.head.y });
      this.tail.pop();
    }
    this.head.x += this.direction.x;
    this.head.y += this.direction.y;
  }

  detectCollision() {
    // Wall
    if (this.head.x < 0) this.head.x = this.grid.columns - 1;
    if (this.head.x > this.grid.columns - 1) this.head.x = 0;
    if (this.head.y < 0) this.head.y = this.grid.rows - 1;
    if (this.head.y > this.grid.rows - 1) this.head.y = 0;

    // Tail
    this.tail.forEach((segment) => {
      if (this.head.x === segment.x && this.head.y === segment.y) this.die();
    });
  }

  eat(food) {
    return this.head.x === food.position.x && this.head.y === food.position.y;
  }

  grow() {
    this.tail.unshift({ x: this.head.x, y: this.head.y });
  }

  die() {
    this.alive = false;
    this.color = { head: '#555555', tail: '#777777' };
    console.log('=> DEAD');
  }

  // TODO: extract all input handling into input.js
  bufferInputCommand(newDirection) {
    let length = this.inputBuffer.length;
    if (length === 0) {
      if (this.directionIsSameOrReverse(this.direction, newDirection)) return;
    } else if (length > 1) {
      if (this.directionIsSameOrReverse(this.inputBuffer[length - 1], newDirection)) return;
    } else this.inputBuffer.shift();
    this.inputBuffer.push(newDirection);

    // console.log(this.inputBuffer.map((d) => d.name));
  }

  updateDirection() {
    if (this.inputBuffer.length > 0) {
      let newDirection = this.inputBuffer.shift();
      if (this.directionIsSameOrReverse(this.direction, newDirection)) return;
      this.direction = newDirection;
      // console.log('-> this.direction', [this.direction.name]);
    }
  }

  // We don't take kindly to reverse movement around here
  directionIsSameOrReverse({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    if (x1 === x2 || x1 === -x2 || y1 === y2 || y1 === -y2) return true;
    else return false;
  }
}
