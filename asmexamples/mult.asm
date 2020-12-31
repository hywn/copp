;; this is a multiplier assignment solution in assembly
;; description:
;;     Your code should
;;     1. load the values in memory at addresses 0x01 and 0x03 into registers
;;     2. compute the product of those values (i.e., multiply)
;;     3. store the product at address 0xA0
;;     4. halt once it is done

;; you might think you would just use a data section to memory into
;; registers but execution always starts at 0x00 so you can't
;
; =data[0x01] 0xc9 0x00 0x23 0x00
; can't do that because it just halts lol
;
; =data[0x01] 0xf 0x00 0x3
; can't do that either because it starts executing random stuff

;; pretty sure the assignment wants you to do this
;; (the binary turns out to be 60 23 64 C9)
load r0 $0x23
load r1 $0xC9

;; we will now:
;; - use r0 as counter (already initialised with [$1])
;; - store ans in r1
;; - use r2 as misc temp register
;; - use r3 to just store 0 because this ISA doesn't have unconditional jump

load r1 $0 ; clear out to use as ans
load r3 $0 ; clear out to use as 0

; handle if [$1] is 0
load r2 :end
jle  r0 r2

=loop
	;; add [$3] to ans
	load r2 [$3]
	add r1 r2

	;; decrease counter
	add r0 $-1

	;; break if counter <= 0
	;; note that you can't just do jle r0 :end
	load r2 :end
	jle  r0 r2

	;; continue loop
	load r2 :loop
	jle  r3 r2
=end

;; store ans in [0xA0] as requested
load r3   $0xA0
load [r3] r1

halt