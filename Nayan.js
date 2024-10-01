const express = require('express');
const cron = require('node-cron'); // cron for scheduled tasks
const logger = require('./Nayan/catalogs/Nayanc.js');

const app = express();
const port = process.env.PORT || 4000;

// Create Express Server for Render
app.get('/', (req, res) => {
  res.send('Hello! Bot is running.');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

// Bot functionalities
const configCustom = {
  autosetbio: {
    status: false,
    bio: `prefix : ${global.config.PREFIX}`,
    note: 'automatically change the bot bio.'
  },
  notification: {
    status: false,
    time: 39, // 39 minutes
    note: 'bot will update you on his informations like all users, all groups, all operators, all admins every 30 minutes'
  },
  greetings: {
    status: true, // enable greetings
    morning: `Good morning everyone, have a nice day.`,
    afternoon: `Good afternoon everyone, don't forget to eat your lunch.`,
    evening: `Good evening everyone, don't forget to eat.`,
    sleep: `Good night everyone, time to sleep.`,
    note: 'Greetings every morning, afternoon, and evening. The timezone is located in Asia/Dhaka.'
  },
  reminder: {
    status: false,
    time: 40, // 40 minutes
    msg: 'Reminder test',
    note: 'This is a reminder for 40 minutes, you can disable it by setting the status to false.'
  },
  autoDeleteCache: {
    status: true,
    time: 10, // 10 minutes
    note: 'Auto delete caches. Set the status to true, if you don’t want to delete caches, set it to false.'
  },
  autoRestart: {
    status: true,
    time: 40, // 40 minutes
    note: 'To avoid problems, enable periodic bot restarts. Set status to false if you want to disable auto restart function.'
  },
  acceptPending: {
    status: false,
    time: 10, // 10 minutes
    note: 'Approve waiting messages after a certain time. Set status to false to disable auto accept message requests.'
  }
};

function autosetbio(config) {
  if (config.status) {
    try {
      api.changeBio(config.bio, (err) => {
        if (err) {
          logger(`Error changing bio: ${err}`, 'setbio');
        } else {
          logger(`Changed the bot bio to: ${config.bio}`, 'setbio');
        }
      });
    } catch (error) {
      logger(`Unexpected error: ${error}`, 'setbio');
    }
  }
}

function notification(config) {
  if (config.status) {
    cron.schedule(`*/${config.time} * * * *`, async () => {
      const operator = global.config.OPERATOR[0];
      api.sendMessage(
        `Bot information\n\nUsers: ${global.data.allUserID.length}\nGroups: ${global.data.allThreadID.length}\nOperators: ${global.config.OPERATOR.length}\nAdmins: ${global.config.ADMINBOT.length}`,
        operator
      );
    });
  }
}

function greetings(config) {
  if (config.status) {
    const timings = [
      { time: '6:00', message: config.morning },
      { time: '12:00', message: config.afternoon },
      { time: '18:00', message: config.evening },
      { time: '22:00', message: config.sleep }
    ];

    timings.forEach(timing => {
      cron.schedule(`${timing.time} * * *`, () => {
        global.data.allThreadID.forEach(threadID => {
          api.sendMessage(timing.message, threadID);
        });
      }, {
        timezone: 'Asia/Dhaka'
      });
    });
  }
}

function reminder(config) {
  if (config.status) {
    cron.schedule(`*/${config.time} * * * *`, async () => {
      global.data.allThreadID.forEach(each => {
        try {
          api.sendMessage(config.msg, each, (err) => {
            if (err) {
              logger(`Error sending reminder: ${err}`, 'reminder');
            }
          });
        } catch (error) {
          logger(`Error in reminder: ${error}`, 'reminder');
        }
      });
    });
  }
}

function autoDeleteCache(config) {
  if (config.status) {
    cron.schedule(`*/${config.time} * * * *`, () => {
      const { exec } = require('child_process');
      exec('rm -rf ../../scripts/commands/cache && mkdir -p ../../scripts/commands/cache && rm -rf ../../scripts/events/cache && mkdir -p ../../scripts/events/cache', (error, stdout, stderr) => {
        if (error) {
          logger(`Error deleting cache: ${error}`, 'cache');
        } else {
          logger('Successfully deleted caches', 'cache');
        }
      });
    });
  }
}

function autoRestart(config) {
  if (config.status) {
    cron.schedule(`*/${config.time} * * * *`, () => {
      logger(`Auto restart in process.`, 'restart');
      process.exit(1);
    });
  }
}

function acceptPending(config) {
  if (config.status) {
    cron.schedule(`*/${config.time} * * * *`, async () => {
      const list = [
        ...(await api.getThreadList(1, null, ['PENDING'])),
        ...(await api.getThreadList(1, null, ['OTHER']))
      ];
      if (list[0]) {
        api.sendMessage('This thread is automatically approved by our system.', list[0].threadID);
      }
    });
  }
}

// Run all bot functions
autosetbio(configCustom.autosetbio);
notification(configCustom.notification);
greetings(configCustom.greetings);
reminder(configCustom.reminder);
autoDeleteCache(configCustom.autoDeleteCache);
autoRestart(configCustom.autoRestart);
acceptPending(configCustom.accpetPending);
