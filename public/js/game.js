const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image("avatar", "assets/maddie.png");
  this.load.image("office", "assets/office2.png");
  this.load.image("otherPlayer", "assets/maddie2.png");
}

function create() {
  const self = this;
  this.socket = io();
  this.add.image(0, 0, "office").setOrigin(0);

  this.otherPlayers = this.physics.add.group();

  this.socket.on("currentPlayers", function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });

  this.socket.on("newPlayer", function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });

  this.socket.on("disconnect", function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  this.socket.on("playerMoved", function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  if (this.avatar) {
    const speed = 100;
    this.avatar.body.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.avatar.body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.avatar.body.setVelocityX(speed);
    }

    //up and down movements
    if (this.cursors.up.isDown) {
      this.avatar.body.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.avatar.body.setVelocityY(speed);
    }

    // emit player movement
    let x = this.avatar.x;
    let y = this.avatar.y;
    // let r = this.avatar.rotation;
    if (
      this.avatar.oldPosition &&
      (x !== this.avatar.oldPosition.x || y !== this.avatar.oldPosition.y)
      // r !== this.avatar.oldPosition.rotation)
    ) {
      this.moving = true;
      this.socket.emit("playerMovement", {
        x: this.avatar.x,
        y: this.avatar.y,
      });
    }

    // save old position data
    this.avatar.oldPosition = {
      x: this.avatar.x,
      y: this.avatar.y,
    };
  }
}

function addPlayer(self, playerInfo) {
  self.avatar = self.physics.add
    .image(playerInfo.x, playerInfo.y, "avatar")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add
    .sprite(playerInfo.x, playerInfo.y, "otherPlayer")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}
