# badjs-sourcemap
> 接收由 [badjs-sourcemap](https://github.com/BetterJS/badjs-sourcemap) 发送过来的文件

### 配置说明
```json
	{
		"port": 80, // 监听的端口
		"output": "./maps" // 接收的文件解压（unzip）的路径, 需要保证有写权限
	}
```

> tips：功能上来说，支持简单文件备份，并不局限于 sourcemap 文件

相关链接：https://github.com/BetterJS/badjs-sourcemap