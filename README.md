# core-proxy

Simple TCP and Unix-Socket Proxy

## Install

	npm install -g core-proxy
	
## Usage

	Options:
	  --source, -s       [required]  [default: "[::1]:3306"]
	  --destination, -d  [required]

- <code>--source</code>: Path to UNIX Socket or hostname:port for TCP
- <code>--destination</code>: hostname:port (TCP only)

All parameters can be passed multiple times.

## Example

	proxy -s /var/mysql/mysql.sock -s [::1]:3306 -d db1.example.com:3306 -d db2.example.com:3306
