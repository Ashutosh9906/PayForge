# PayForge
An backend project for the learning how the payment infrastructure works 

## Do be done list
```
Later, we'll make this cleaner by creating a small database-error mapping layer, because PayForge will eventually have many errors:

ER_DUP_ENTRY       → EMAIL_ALREADY_EXISTS
ER_NO_REFERENCED... → USER_NOT_FOUND
insufficient funds → INSUFFICIENT_BALANCE
frozen account     → ACCOUNT_FROZEN
...
```